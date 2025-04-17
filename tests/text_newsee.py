from vanna.qianwen import QianWenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore
import logging
import os
import json
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

qianwen_config = {}
qianwen_config["model"] = os.getenv("QWEN_MODEL")
qianwen_config["base_url"] = os.getenv("QWEN_BASE_URL")
qianwen_config["api_key"] = os.getenv("QWEN_KEY")
qianwen_config["language"] = "zh"
qianwen_config["temperature"] = 0.2
logger.info("qianwen_config配置初始化参数: %s", qianwen_config)


class MyVanna(ChromaDB_VectorStore, QianWenAI_Chat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        QianWenAI_Chat.__init__(self, config=config)


vn = MyVanna(config=qianwen_config)

# 连接到MySQL数据库, 获取环境变量
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_PORT = os.getenv("MYSQL_PORT")
MYSQL_DB = os.getenv("MYSQL_DB")

vn.connect_to_mysql(
    host=MYSQL_HOST,
    dbname=MYSQL_DB,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    port=int(MYSQL_PORT),
)

# 信息模式查询可能需要根据您的数据库进行一些调整。这是一个很好的起点。限定为ns_dws库
df_information_schema = vn.run_sql(
    "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ns_dws'"
)

# 这将把信息模式分解成 LLM 可以引用的更小的块
plan = vn.get_training_plan_generic(df_information_schema)

# 使用信息模式训练
vn.train(plan=plan)

# 业务术语或定义的文档训练
vn.train(
    documentation="""
    -收缴率定义为：物业费实收/物业费应收 * 100%
    -2024年收缴率：2024年物业费实收/2024年物业费应收 * 100%
    -集团：中国金茂
    -狗：金茂狗
"""
)

# QA的方式训练
# 从train-sql-qa.json文件中读取SQL QA数据
with open("main/data/train-sql-qa.json", "r") as f:
    sql_qa_data = json.load(f)

# 训练SQL QA数据
for item in sql_qa_data:
    vn.train(
        question=item["question"],
        sql=item["sql"],
    )

# SQL查询训练
# vn.train(sql="SELECT * FROM my-table WHERE name = 'John Doe'")

from vanna.flask import VannaFlaskApp

app = VannaFlaskApp(vn, allow_llm_to_see_data=True)
app.run()

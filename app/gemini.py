from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_KEY"))
model = "gemini-3.5-flash"


def create_question(prefix):
    if prefix:
        word=prefix
    else:
        word="ふつう"  

    input = f"""
        あなたは交流を助ける仲介役です。
        現在のキャラクターの称号は「{word}」です。
        その称号に合った雰囲気で、他のユーザーと会話が広がる質問を1つ作成してください。
        例:
        好きなゲームは何ですか？
        質問だけを返してください。
        ## 条件
        - 20文字以内
        - 疑問文にする
        - 挨拶や説明は不要
        - **質問文だけを返してください。**
        """
   
    response = client.models.generate_content(
    model=model,
    contents=input
    )

    return response.text.strip()
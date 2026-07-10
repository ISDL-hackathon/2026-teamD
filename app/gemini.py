from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_KEY"))
model = "gemini-2.5-flash-lite"


def create_question(prefix):
    print("create Q")
    if prefix:
        word=prefix
    else:
        word="なし"  
    print(f"word:",word)
    prompt = f"""
        あなたは交流を助ける仲介役です。
        現在のキャラクターの称号は「{word}」です。
        その称号に合った雰囲気で、他のユーザーと会話が広がる質問を1つ作成してください。
        例:
        好きなゲームは何ですか？
        質問だけを返してください。
        ## 条件
        - 20文字以内
        - 疑問文にする
        - 1文のみ
        - 挨拶・説明・前置きは禁止
        - 「質問:」などのラベルは禁止
        - 出力は質問文のみ
        """
   
    response = client.models.generate_content(
        model=model,
        contents=prompt
    )

    question = response.text.strip().replace('"', '').replace('「', '').replace('」', '')
    return question
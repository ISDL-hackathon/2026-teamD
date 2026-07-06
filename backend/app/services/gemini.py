def test_gemini_response(message: str) -> str:
    """フロントから届いた文字に、テスト用の返事を返す関数"""
    return f"【Geminiテスト応答】『{message}』って言いましたね！バックエンドは正常に動いてますよ！"
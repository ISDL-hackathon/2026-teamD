from app import supabase

def get_mission_id(uid):
    mission_id = supabase.table("conversations").select("mission_id").eq("my_id", uid).execute()
    if mission_id:
        return mission_id.data[0]["mission_id"]
    return None

# QRとDB照合
def verify_conversation_qr(mission_id):
    try:
        response = (
            supabase.table("conversations")
            .select("*")
            .eq("mission_id", mission_id)
            .eq("is_con", True)
            .execute()
        )
        if not response.data:
            return False
        return response.data[0]
    except Exception as e:
        print(f"QR照合失敗:{e}")
        return False
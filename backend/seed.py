import asyncio
from app.core.database import connect_to_mongo, close_mongo_connection, db
from app.crud.user import create_user, get_user_by_email
from app.models.user import UserCreate

async def seed():
    await connect_to_mongo()
    
    # Check if subdean exists
    existing = await get_user_by_email("subdean@example.com")
    if not existing:
        print("Creating initial Subdean...")
        user = UserCreate(
            full_name="Sub Decano Admin",
            email="subdean@example.com",
            password="adminpassword",
            role="subdean"
        )
        await create_user(user)
        print("Subdean created: subdean@example.com / adminpassword")
    else:
        print("Subdean already exists.")

    await close_mongo_connection()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed())

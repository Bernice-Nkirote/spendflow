from app.core.database import SessionLocal
from app.models.company import Company
from app.seeds.seed_permission import seed_permissions_for_company


def backfill_permissions_for_existing_companies() -> None:
    db = SessionLocal()

    try:
        companies = db.query(Company).all()

        for company in companies:
            seed_permissions_for_company(company.id, db)

        db.commit()

        print(f"Backfilled permissions for {len(companies)} companie(s).")

    except Exception as error:
        db.rollback()
        print("Permission backfill failed:", error)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    backfill_permissions_for_existing_companies()
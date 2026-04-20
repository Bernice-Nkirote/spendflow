from apscheduler.schedulers.background import BackgroundScheduler
from app.services.report_service import ReportService
from app.core.database import SessionLocal
import os
from app.utils.time import utc_now

scheduler = BackgroundScheduler()

def generate_reports_job():
    db = SessionLocal()
    service = ReportService()

    try:
        now = utc_now()
        print(f"[{now.isoformat()}] Generating reports...")


        # Generate files
        supplier_file = service.supplier_excel(db)
        department_file = service.department_excel(db)
        lead_time_file = service.lead_time_excel(db)

        # Ensure folder exists
        os.makedirs("reports", exist_ok=True)

        # Save with timestamp
        supplier_filename = f"reports/supplier_report_{now.date()}.xlsx"
        department_filename = f"reports/department_report_{now.date()}.xlsx"
        lead_filename = f"reports/lead_time_report_{now.date()}.xlsx"

        # Save files locally (MVP)
        with open(supplier_filename, "wb") as f:
            f.write(supplier_file.read())

        with open(department_filename, "wb") as f:
            f.write(department_file.read())

        with open(lead_filename, "wb") as f:
            f.write(lead_time_file.read())

        print("Reports generated successfully!")

    except Exception as e:
        print("Error generating reports:", str(e))

    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        generate_reports_job,
        "interval",
        hours=48,
        max_instances=1
    )
    scheduler.start()


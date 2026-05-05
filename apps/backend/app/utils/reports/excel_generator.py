from io import BytesIO

from openpyxl import Workbook
from datetime import datetime

def clean_excel_value(value):
    if isinstance(value, datetime) and value.tzinfo is not None:
        return value.replace(tzinfo=None)

    return value


def generate_excel_report(
    sheet_name: str,
    headers: list[str],
    rows: list[list],
) -> BytesIO:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = sheet_name

    sheet.append(headers)

    for row in rows:
        sheet.append([clean_excel_value(value) for value in row])

    sheet.freeze_panes = "A2"

    for column_cells in sheet.columns:
        max_length = 0
        column_letter = column_cells[0].column_letter

        for cell in column_cells:
            if cell.value is not None:
                max_length = max(max_length, len(str(cell.value)))

        sheet.column_dimensions[column_letter].width = max_length + 2

    output = BytesIO()
    workbook.save(output)
    output.seek(0)

    return output
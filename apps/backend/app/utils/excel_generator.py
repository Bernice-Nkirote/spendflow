from openpyxl import Workbook
from io import BytesIO


def generate_excel(data, headers):
    wb = Workbook()
    ws = wb.active

    # Add headers
    ws.append(headers)

    # Add rows
    for row in data:
        ws.append(list(row))

    # Save to memory
    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    return stream
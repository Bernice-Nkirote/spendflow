import csv
from io import StringIO


def generate_csv_report(
    headers: list[str],
    rows: list[list],
) -> StringIO:
    output = StringIO()

    writer = csv.writer(output)
    writer.writerow(headers)

    for row in rows:
        writer.writerow(row)

    output.seek(0)
    return output
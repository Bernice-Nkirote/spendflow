import axiosInstance from "../../../api/axiosInstance";
import type {
  ReportStatusOptions,
  ReportPaymentMethodOptions,
} from "../types/report.types";

export async function getReportStatusOptions(): Promise<ReportStatusOptions> {
  const response = await axiosInstance.get<ReportStatusOptions>(
    "/metadata/enums/report-statuses",
  );

  return response.data;
}

export async function getPaymentMethodOptions(): Promise<ReportPaymentMethodOptions> {
  const response = await axiosInstance.get<ReportPaymentMethodOptions>(
    "/metadata/enums/payment-methods",
  );

  return response.data;
}

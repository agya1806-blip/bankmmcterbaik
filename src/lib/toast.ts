import toast from "react-hot-toast";

export const showToast = {
  success: (msg: string) => toast.success(msg, { style: { fontSize: "13px", fontWeight: 600, borderRadius: "12px", padding: "10px 16px" } }),
  error: (msg: string) => toast.error(msg, { style: { fontSize: "13px", fontWeight: 600, borderRadius: "12px", padding: "10px 16px" } }),
  loading: (msg: string) => toast.loading(msg, { style: { fontSize: "13px", fontWeight: 600, borderRadius: "12px", padding: "10px 16px" } }),
  dismiss: (id?: string) => toast.dismiss(id),
};

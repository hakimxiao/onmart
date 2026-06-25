import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "../lib/api";

export function useAdminProductPage() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState(null);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const isAdmin = meData?.user?.role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiFetch("/api/admin/products", { getToken }),
    enabled: isSignedIn && isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ body, id }) => {
      if (id) {
        return apiFetch(`/api/admin/products/${id}`, {
          getToken,
          method: "PATCH",
          body,
        });
      }
      return apiFetch("/api/admin/products", {
        getToken,
        method: "POST",
        body,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId) =>
      apiFetch(`/api/admin/products/${productId}`, {
        getToken,
        method: "DELETE",
      }),
    onMutate: (productId) => {
      setDeleteNotice((notice) =>
        notice?.productId === productId ? null : notice,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setDeleteNotice(null);
    },
    onError: (err, productId) => {
      const message =
        err?.code === "PRODUCT_HAS_ORDERS" || err?.status === 409
          ? "This product is already used in an order. Deactivate it instead so order history stays intact."
          : err instanceof Error
            ? err.message
            : "Delete failed";

      setDeleteNotice({
        productId,
        message,
      });
    },
  });

  return {
    getToken,
    isSignedIn,
    meData,
    modalOpen,
    setModalOpen,
    editing,
    setEditing,
    products: data?.products ?? [],
    isLoading,
    saveMutation,
    deleteMutation,
    deleteNotice,
    setDeleteNotice,
  };
}

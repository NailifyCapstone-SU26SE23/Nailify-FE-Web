import { useState } from "react";

export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return {
    closeModal: () => setIsOpen(false),
    isOpen,
    openModal: () => setIsOpen(true),
    setIsOpen,
    toggleModal: () => setIsOpen((current) => !current),
  };
}

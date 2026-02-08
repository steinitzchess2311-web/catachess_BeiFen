import React, { useState } from 'react';
import CreateModal from './CreateModal';
import './NewItemButtons.css';

interface NewItemButtonsProps {
  currentParentId: string;
  onSuccess: () => void;
}

const NewItemButtons: React.FC<NewItemButtonsProps> = ({ currentParentId, onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'folder' | 'study'>('folder');

  const handleOpenModal = (type: 'folder' | 'study') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    onSuccess();
  };

  return (
    <>
      <button
        className="new-item-button"
        onClick={() => handleOpenModal('folder')}
      >
        + New Folder
      </button>
      <button
        className="new-item-button"
        onClick={() => handleOpenModal('study')}
      >
        + New Study
      </button>
      {isModalOpen && (
        <CreateModal
          isOpen={isModalOpen}
          type={modalType}
          currentParentId={currentParentId}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default NewItemButtons;

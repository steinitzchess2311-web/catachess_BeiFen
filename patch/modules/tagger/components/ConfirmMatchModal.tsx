import React from "react";

type ConfirmMatchModalProps = {
  open: boolean;
  candidates: Array<{ white: string; black: string; game_index?: number }>;
  onClose: () => void;
};

const ConfirmMatchModal: React.FC<ConfirmMatchModalProps> = ({
  open,
  candidates,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="tagger-modal-backdrop" onClick={onClose}>
      <div className="tagger-modal" onClick={(event) => event.stopPropagation()}>
        <h3>Confirm Player Match</h3>
        <p>
          Multiple candidates were detected in the PGN headers. Choose the correct
          name in the backend admin flow (confirmation API will be added).
        </p>
        <div className="tagger-modal-list">
          {candidates.map((candidate, index) => (
            <div key={`${candidate.white}-${candidate.black}-${index}`}>
              Game {candidate.game_index ?? index + 1}: {candidate.white} vs{" "}
              {candidate.black}
            </div>
          ))}
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ConfirmMatchModal;

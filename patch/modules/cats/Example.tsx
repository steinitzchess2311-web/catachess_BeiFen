/**
 * Example Usage - How to use CatPet
 *
 * This is a demo component showing how to integrate CatPet into your app.
 * Copy this code to your application to add a desktop pet!
 */

import React from 'react';
import { CatPet } from './CatPet';

export function CatPetExample() {
  const handleInteraction = (type: string) => {
    console.log(`[CAT] Interaction: ${type}`);
  };

  return (
    <div>
      {/* Basic usage - just add the component anywhere */}
      <CatPet />

      {/* Custom configuration */}
      {/*
      <CatPet
        initialPosition={{ x: 200, y: 150 }}
        scale={3}
        enableDrag={true}
        onInteraction={handleInteraction}
      />
      */}
    </div>
  );
}

/**
 * How to add to your app:
 *
 * 1. Import the component:
 *    import { CatPet } from '@patch/modules/cats';
 *
 * 2. Add it to your root component:
 *    function App() {
 *      return (
 *        <div>
 *          <YourContent />
 *          <CatPet />  // The cat will appear on top
 *        </div>
 *      );
 *    }
 *
 * 3. The cat is now draggable and animated!
 */

export default CatPetExample;

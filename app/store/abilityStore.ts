import { create } from 'zustand';
import { produce } from 'immer';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType } from '@/app/types';

// Ability card interface
export interface AbilityCard {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'insight' | 'momentum' | 'hybrid';
  iconPath: string;
  cardImagePath: string;
  unlocked: boolean;
  equipped: boolean;
  slotIndex?: number; // 0, 1, 2 for the three slots
}

// Ability store interface
interface AbilityState {
  // All available ability cards
  availableCards: Record<string, AbilityCard>;
  // Cards currently equipped (max 3)
  equippedCards: AbilityCard[];
  // Active ability states (for abilities that need activation)
  activeAbilities: Record<string, boolean>;
  
  // Actions
  unlockCard: (cardId: string) => void;
  equipCard: (cardId: string, slotIndex: number) => boolean;
  unequipCard: (slotIndex: number) => void;
  getEquippedCards: () => AbilityCard[];
  getUnlockedCards: () => AbilityCard[];
  isCardUnlocked: (cardId: string) => boolean;
  isCardEquipped: (cardId: string) => boolean;
  
  // Ability activation
  activateAbility: (cardId: string) => boolean;
  deactivateAbility: (cardId: string) => void;
  isAbilityActive: (cardId: string) => boolean;
}

// Default ability cards
const DEFAULT_ABILITY_CARDS: Record<string, Omit<AbilityCard, 'unlocked' | 'equipped'>> = {
  'fast_learner': {
    id: 'fast_learner',
    name: 'Fast Learner',
    description: 'Active: Next correct answer gives 2x momentum. Deactivates after any answer.',
    cost: 25,
    type: 'insight',
    iconPath: '/images/ui/fast-learner-icon.png',
    cardImagePath: '/images/journal/fast-learner.png'
  },
  'laser_focus': {
    id: 'laser_focus',
    name: 'Laser Focus',
    description: 'Increases momentum gain and provides bonus insight for consecutive correct answers.',
    cost: 2,
    type: 'momentum',
    iconPath: '/images/cards/card-laser-focus.png',
    cardImagePath: '/images/cards/card-laser-focus.png'
  },
  'perfect_path': {
    id: 'perfect_path',
    name: 'Perfect Path',
    description: 'Optimizes learning paths and reveals hidden connections between concepts.',
    cost: 3,
    type: 'hybrid',
    iconPath: '/images/ui/perfect-path-icon.png',
    cardImagePath: '/images/cards/card-perfect-path.png'
  }
};

export const useAbilityStore = create<AbilityState>((set, get) => ({
  // Initialize with default cards (all locked)
  availableCards: Object.fromEntries(
    Object.entries(DEFAULT_ABILITY_CARDS).map(([id, card]) => [
      id,
      { ...card, unlocked: false, equipped: false }
    ])
  ),
  equippedCards: [],
  activeAbilities: {}, // Track which abilities are currently activated

  // Unlock a specific ability card
  unlockCard: (cardId: string) => {
    set(produce(state => {
      if (state.availableCards[cardId] && !state.availableCards[cardId].unlocked) {
        state.availableCards[cardId].unlocked = true;
        
        console.log(`🃏 [AbilityStore] Unlocked ability card: ${cardId}`);
        
        // Dispatch event for UI feedback
        centralEventBus.dispatch(
          GameEventType.ABILITY_CARD_UNLOCKED,
          { cardId, cardName: state.availableCards[cardId].name },
          'abilityStore.unlockCard'
        );
      }
    }));
  },

  // Equip a card to a specific slot (0, 1, 2)
  equipCard: (cardId: string, slotIndex: number) => {
    const card = get().availableCards[cardId];
    
    if (!card || !card.unlocked || slotIndex < 0 || slotIndex > 2) {
      return false;
    }

    set(produce(state => {
      // Remove card from current slot if already equipped
      const currentSlot = state.equippedCards.findIndex(c => c.id === cardId);
      if (currentSlot !== -1) {
        state.equippedCards[currentSlot].equipped = false;
        state.equippedCards[currentSlot].slotIndex = undefined;
        state.equippedCards.splice(currentSlot, 1);
      }

      // Remove any card currently in the target slot
      const existingCardIndex = state.equippedCards.findIndex(c => c.slotIndex === slotIndex);
      if (existingCardIndex !== -1) {
        state.availableCards[state.equippedCards[existingCardIndex].id].equipped = false;
        state.availableCards[state.equippedCards[existingCardIndex].id].slotIndex = undefined;
        state.equippedCards.splice(existingCardIndex, 1);
      }

      // Equip the new card
      const equippedCard = { ...card, equipped: true, slotIndex };
      state.availableCards[cardId].equipped = true;
      state.availableCards[cardId].slotIndex = slotIndex;
      state.equippedCards.push(equippedCard);
      
      // Sort equipped cards by slot index for consistency
      state.equippedCards.sort((a, b) => (a.slotIndex || 0) - (b.slotIndex || 0));
    }));

    console.log(`🃏 [AbilityStore] Equipped ${cardId} to slot ${slotIndex}`);
    
    centralEventBus.dispatch(
      GameEventType.ABILITY_CARD_EQUIPPED,
      { cardId, slotIndex },
      'abilityStore.equipCard'
    );

    return true;
  },

  // Unequip a card from a specific slot
  unequipCard: (slotIndex: number) => {
    set(produce(state => {
      const cardIndex = state.equippedCards.findIndex(c => c.slotIndex === slotIndex);
      if (cardIndex !== -1) {
        const cardId = state.equippedCards[cardIndex].id;
        state.availableCards[cardId].equipped = false;
        state.availableCards[cardId].slotIndex = undefined;
        state.equippedCards.splice(cardIndex, 1);
        
        console.log(`🃏 [AbilityStore] Unequipped card from slot ${slotIndex}`);
        
        centralEventBus.dispatch(
          GameEventType.ABILITY_CARD_UNEQUIPPED,
          { cardId, slotIndex },
          'abilityStore.unequipCard'
        );
      }
    }));
  },

  // Get currently equipped cards
  getEquippedCards: () => {
    return get().equippedCards;
  },

  // Get all unlocked cards
  getUnlockedCards: () => {
    const { availableCards } = get();
    return Object.values(availableCards).filter(card => card.unlocked);
  },

  // Check if a card is unlocked
  isCardUnlocked: (cardId: string) => {
    return get().availableCards[cardId]?.unlocked || false;
  },

  // Check if a card is equipped
  isCardEquipped: (cardId: string) => {
    return get().availableCards[cardId]?.equipped || false;
  },

  // Toggle card equipping - auto-equip to leftmost slot or unequip
  toggleCard: (cardId: string) => {
    const card = get().availableCards[cardId];
    if (!card || !card.unlocked) return false;

    if (card.equipped) {
      // Card is equipped, unequip it
      get().unequipCard(card.slotIndex!);
      return true;
    } else {
      // Card is not equipped, find leftmost available slot
      const equippedCards = get().equippedCards;
      const occupiedSlots = new Set(equippedCards.map(c => c.slotIndex));
      
      // Find first available slot (0, 1, 2)
      for (let slot = 0; slot < 3; slot++) {
        if (!occupiedSlots.has(slot)) {
          return get().equipCard(cardId, slot);
        }
      }
      
      // All slots are full, unequip slot 0 and equip this card there
      get().unequipCard(0);
      return get().equipCard(cardId, 0);
    }
  },

  // Activate an ability (costs insight based on ability cost)
  activateAbility: (cardId: string) => {
    const card = get().availableCards[cardId];
    if (!card || !card.unlocked || !card.equipped) {
      console.log(`🚫 [AbilityStore] Cannot activate ${cardId} - not equipped`);
      return false;
    }

    // Check if we have enough insight
    const { insight, updateInsight } = require('./resourceStore').useResourceStore.getState();
    if (insight < card.cost) {
      console.log(`🚫 [AbilityStore] Cannot activate ${cardId} - need ${card.cost} insight, have ${insight}`);
      return false;
    }

    // Spend insight and activate ability
    updateInsight(-card.cost);
    set(produce(state => {
      state.activeAbilities[cardId] = true;
    }));

    console.log(`⚡ [AbilityStore] Activated ${cardId} for ${card.cost} insight`);
    
    centralEventBus.dispatch(
      GameEventType.ABILITY_ACTIVATED,
      { cardId, cost: card.cost },
      'abilityStore.activateAbility'
    );

    return true;
  },

  // Deactivate an ability
  deactivateAbility: (cardId: string) => {
    set(produce(state => {
      state.activeAbilities[cardId] = false;
    }));
    console.log(`🔄 [AbilityStore] Deactivated ${cardId}`);
  },

  // Check if an ability is currently active
  isAbilityActive: (cardId: string) => {
    return get().activeAbilities[cardId] || false;
  }
}));



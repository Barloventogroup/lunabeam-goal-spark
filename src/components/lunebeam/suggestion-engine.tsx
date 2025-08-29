import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SuggestionOption {
  id: string;
  emoji: string;
  text: string;
  explain?: string;
}

interface SuggestionRound {
  options: SuggestionOption[];
}

interface SuggestionData {
  rounds: SuggestionRound[];
  explanations: Record<string, string>;
}

interface SuggestionEngineProps {
  category: string;
  onSelectOption: (option: SuggestionOption) => void;
  onMetaAction: (action: 'new_ideas' | 'explain' | 'write_own' | 'pause') => void;
}

const SUGGESTION_POOLS: Record<string, SuggestionData> = {
  health: {
    rounds: [
      {
        options: [
          { id: 'walk', emoji: '🚶', text: 'Take a short walk outside', explain: 'even 5 minutes counts.' },
          { id: 'new_snack', emoji: '🥗', text: 'Try a new snack or fruit', explain: 'something fresh to taste.' },
          { id: 'sleep_earlier', emoji: '😴', text: 'Go to bed 15 min earlier', explain: 'small step for better rest.' }
        ]
      },
      {
        options: [
          { id: 'extra_water', emoji: '💧', text: 'Drink an extra glass of water', explain: 'just add one glass today.' },
          { id: 'stretch_5', emoji: '🧘', text: 'Try 5 min of stretching or breathing', explain: 'a quick pause to reset.' },
          { id: 'dance_song', emoji: '🎶', text: 'Dance to one favorite song', explain: 'move however feels good.' }
        ]
      }
    ],
    explanations: {
      walk: 'even 5 minutes counts.',
      extra_water: 'just add one glass today.',
      stretch_5: 'a quick pause to reset.'
    }
  },
  education: {
    rounds: [
      {
        options: [
          { id: 'read_page', emoji: '📖', text: 'Read 1 page of a book or article', explain: 'does not have to be long.' },
          { id: 'podcast_clip', emoji: '🎧', text: 'Listen to a short podcast clip', explain: 'even 2 minutes counts.' },
          { id: 'new_word', emoji: '💬', text: 'Learn 1 new word in another language', explain: 'just one phrase you like.' }
        ]
      },
      {
        options: [
          { id: 'new_app', emoji: '🎮', text: 'Try a new app or game', explain: 'something educational or fun.' },
          { id: 'brain_teaser', emoji: '🧩', text: 'Do a puzzle or brain teaser', explain: 'any quick challenge works.' },
          { id: 'how_to_video', emoji: '📺', text: 'Watch a short how-to video', explain: 'pick something you are curious about.' }
        ]
      }
    ],
    explanations: {
      read_page: 'does not have to be long.',
      podcast_clip: 'even 2 minutes counts.',
      new_word: 'just one phrase you like.'
    }
  },
  social_skills: {
    rounds: [
      {
        options: [
          { id: 'quick_text', emoji: '📱', text: 'Send a quick hi text', explain: 'just a hello, no pressure.' },
          { id: 'coffee_tea', emoji: '☕', text: 'Ask someone to grab coffee/tea', explain: 'pick a time that feels good.' },
          { id: 'share_meme', emoji: '📨', text: 'Share a funny meme with someone', explain: 'something light to share.' }
        ]
      },
      {
        options: [
          { id: 'multiplayer_game', emoji: '🕹️', text: 'Try a new multiplayer game', explain: 'online or in person works.' },
          { id: 'say_hi', emoji: '👋', text: 'Say hi to someone new', explain: 'just a friendly greeting.' },
          { id: 'give_compliment', emoji: '🤗', text: 'Give someone a compliment', explain: 'something genuine you notice.' }
        ]
      }
    ],
    explanations: {
      quick_text: 'just a hello, no pressure.',
      share_meme: 'something light to share.',
      coffee_tea: 'pick a time that feels good.'
    }
  },
  independent_living: {
    rounds: [
      {
        options: [
          { id: 'doodle', emoji: '🖊️', text: 'Doodle for 5 minutes', explain: 'grab paper, sketch anything.' },
          { id: 'playlist', emoji: '🎵', text: 'Make a short playlist', explain: 'pick 2–3 songs you love.' },
          { id: 'take_photo', emoji: '📸', text: 'Take a photo of something you like', explain: 'snap what catches your eye.' }
        ]
      },
      {
        options: [
          { id: 'simple_recipe', emoji: '🍳', text: 'Try a simple recipe', explain: 'start with something easy.' },
          { id: 'journal_line', emoji: '📝', text: 'Write one line in a journal or story', explain: 'whatever comes to mind.' },
          { id: 'small_craft', emoji: '🧵', text: 'Start a small craft (origami, Lego, etc.)', explain: 'any hands-on project works.' }
        ]
      }
    ],
    explanations: {
      doodle: 'grab paper, sketch anything.',
      playlist: 'pick 2–3 songs you love.',
      take_photo: 'snap what catches your eye.'
    }
  }
};

export const SuggestionEngine: React.FC<SuggestionEngineProps> = ({
  category,
  onSelectOption,
  onMetaAction
}) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [notSureCount, setNotSureCount] = useState(0);
  const [explainMode, setExplainMode] = useState(false);
  const [shownOptions, setShownOptions] = useState<Set<string>>(new Set());

  const categoryData = SUGGESTION_POOLS[category];
  
  useEffect(() => {
    // Reset state when category changes
    setCurrentRound(0);
    setNotSureCount(0);
    setExplainMode(false);
    setShownOptions(new Set());
  }, [category]);

  if (!categoryData) {
    return (
      <div className="space-y-4">
        <p className="text-foreground">Sorry, I don't have suggestions for this area yet.</p>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('write_own')}
            className="flex items-center gap-2"
          >
            ✏️ Write your own
          </Button>
        </div>
      </div>
    );
  }

  const handleNotSure = () => {
    const newNotSureCount = notSureCount + 1;
    setNotSureCount(newNotSureCount);

    if (newNotSureCount === 1) {
      // First "Not sure" - show next round
      const nextRound = (currentRound + 1) % categoryData.rounds.length;
      setCurrentRound(nextRound);
    } else if (newNotSureCount === 2) {
      // Second "Not sure" - enter explain mode
      setExplainMode(true);
    } else {
      // Third+ "Not sure" - show meta options
      // This will be handled by showing meta options in render
    }
  };

  const getCategoryPrompt = () => {
    switch (category) {
      case 'health':
        return "Here are a few ideas for health goals. Which one feels doable?";
      case 'education':
        return "Want to pick a quick learning goal?";
      case 'social_skills':
        return "Here are some easy social goals. What do you think?";
      case 'independent_living':
        return "Want to try something creative?";
      default:
        return "Here are some goal ideas. What sounds good?";
    }
  };

  const getSecondRoundPrompt = () => {
    return "No worries. Let's look at some other options:";
  };

  // Show meta options after 3rd "Not sure"
  if (notSureCount >= 3) {
    return (
      <div className="space-y-4">
        <p className="text-foreground">All good 👍 Want to…</p>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('new_ideas')}
            className="flex items-center gap-2"
          >
            🔄 See new ideas
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('explain')}
            className="flex items-center gap-2"
          >
            📖 Get more detail
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('write_own')}
            className="flex items-center gap-2"
          >
            ✏️ Write your own
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('pause')}
            className="flex items-center gap-2"
          >
            ⏸ Pause for now
          </Button>
        </div>
      </div>
    );
  }

  const currentOptions = categoryData.rounds[currentRound]?.options || [];
  
  const getPromptText = () => {
    if (notSureCount === 0) {
      return getCategoryPrompt();
    } else if (notSureCount === 1) {
      return getSecondRoundPrompt();
    } else {
      return "Here are the options with more detail:";
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-foreground">{getPromptText()}</p>
      
      <div className="flex flex-wrap gap-2">
        {currentOptions.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            onClick={() => onSelectOption(option)}
            className="flex items-center gap-2 text-left h-auto p-3 whitespace-normal"
          >
            <span className="text-lg">{option.emoji}</span>
            <div className="flex flex-col items-start">
              <span>{option.text}</span>
              {explainMode && option.explain && (
                <span className="text-xs text-muted-foreground mt-1">
                  → {option.explain}
                </span>
              )}
            </div>
          </Button>
        ))}
        
        <Button 
          variant="outline" 
          onClick={handleNotSure}
          className="flex items-center gap-2"
        >
          ❓ Not sure
        </Button>
      </div>
    </div>
  );
};
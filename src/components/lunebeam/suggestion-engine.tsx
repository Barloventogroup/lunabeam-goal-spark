import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface FollowUpChoice {
  id: string;
  text: string;
}

interface FollowUp {
  question: string;
  choices: FollowUpChoice[];
  next_follow_up?: FollowUp;
}

interface SuggestionOption {
  id: string;
  text: string;
  follow_up?: FollowUp;
}

interface CategoryData {
  options: Record<string, SuggestionOption>;
  explain_examples: Record<string, string[]>;
}

interface SuggestionEngineProps {
  category: string;
  onSelectOption: (option: SuggestionOption) => void;
  onMetaAction: (action: 'new_ideas' | 'explain' | 'write_own' | 'pause') => void;
}

const SUGGESTION_POOLS: Record<string, CategoryData> = {
  health: {
    options: {
      walk: {
        id: 'walk',
        text: '🚶 Take a short walk',
        follow_up: {
          question: 'Awesome. Where do you want to walk?',
          choices: [
            { id: 'outside', text: '🌳 Outside near home' },
            { id: 'school', text: '🏫 Around school/work' },
            { id: 'inside', text: '🚶 Inside (hallway, mall)' },
            { id: 'not_sure', text: '❓ Not sure' }
          ],
          next_follow_up: {
            question: 'For how long?',
            choices: [
              { id: '5min', text: '⏱ 5 min' },
              { id: '10min', text: '⏱ 10 min' },
              { id: 'more', text: '⏱ More' },
              { id: 'not_sure', text: '❓ Not sure' }
            ]
          }
        }
      },
      stretch: {
        id: 'stretch',
        text: '🧘 Try 5 min of stretching',
        follow_up: {
          question: 'Cool. When do you want to stretch?',
          choices: [
            { id: 'now', text: '🕑 Now' },
            { id: 'bed', text: '🌙 Before bed' },
            { id: 'later', text: '📅 Later today' },
            { id: 'not_sure', text: '❓ Not sure' }
          ]
        }
      },
      new_snack: {
        id: 'new_snack',
        text: '🥗 Try a new snack or fruit',
        follow_up: {
          question: 'Nice! What sounds good?',
          choices: [
            { id: 'fruit', text: '🍎 A fruit' },
            { id: 'veggie', text: '🥕 A veggie' },
            { id: 'healthy_snack', text: '🥜 Healthy snack' },
            { id: 'not_sure', text: '❓ Not sure' }
          ]
        }
      }
    },
    explain_examples: {
      walk: ['🌳 Outside → fresh air, even 5 min counts.', '🏫 School/work → walk a loop nearby.', '🚶 Inside → hallway, mall, or around the house.'],
      stretch: ['🕑 Now → quick break from what you\'re doing.', '🌙 Before bed → helps you relax.', '📅 Later → when you have a quiet moment.'],
      new_snack: ['🍎 Fruit → something sweet and fresh.', '🥕 Veggie → crunchy and satisfying.', '🥜 Healthy snack → nuts, yogurt, or crackers.']
    }
  },
  learning: {
    options: {
      read_page: {
        id: 'read_page',
        text: '📖 Read 1 page of a book/article',
        follow_up: {
          question: 'Nice. Do you know what you\'ll read?',
          choices: [
            { id: 'book', text: '📖 A book' },
            { id: 'article', text: '📰 An article' },
            { id: 'phone', text: '📲 Something on your phone' },
            { id: 'not_sure', text: '❓ Not sure' }
          ],
          next_follow_up: {
            question: 'When do you want to read it?',
            choices: [
              { id: 'now', text: '🕑 Right now' },
              { id: 'bed', text: '🌙 Before bed' },
              { id: 'later', text: '📅 Later today' },
              { id: 'not_sure', text: '❓ Not sure' }
            ]
          }
        }
      },
      listen_podcast: {
        id: 'listen_podcast',
        text: '🎧 Listen to a short podcast clip',
        follow_up: {
          question: 'Cool. What kind of podcast?',
          choices: [
            { id: 'music', text: '🎶 Music/entertainment' },
            { id: 'learning', text: '🧠 Learning/knowledge' },
            { id: 'funny', text: '😂 Funny stories' },
            { id: 'not_sure', text: '❓ Not sure' }
          ],
          next_follow_up: {
            question: 'When will you listen?',
            choices: [
              { id: 'now', text: '🕑 Right now' },
              { id: 'later', text: '📅 Later today' },
              { id: 'not_sure', text: '❓ Not sure' }
            ]
          }
        }
      },
      new_word: {
        id: 'new_word',
        text: '💬 Learn 1 new word',
        follow_up: {
          question: 'Fun! What language?',
          choices: [
            { id: 'spanish', text: '🇪🇸 Spanish' },
            { id: 'french', text: '🇫🇷 French' },
            { id: 'other', text: '🌍 Another language' },
            { id: 'not_sure', text: '❓ Not sure' }
          ]
        }
      }
    },
    explain_examples: {
      read_page: ['📖 Book → pick one page only.', '📰 Article → skim a short piece.', '📲 Phone → something light you enjoy.'],
      listen_podcast: ['🎶 Music → something fun to listen to.', '🧠 Learning → pick up something new.', '😂 Funny → laugh and learn.'],
      new_word: ['🇪🇸 Spanish → hola, gracias, etc.', '🇫🇷 French → bonjour, merci, etc.', '🌍 Other → pick any language you like.']
    }
  },
  social: {
    options: {
      send_hi_text: {
        id: 'send_hi_text',
        text: '📱 Send a quick hi text',
        follow_up: {
          question: 'Nice. Who do you want to text?',
          choices: [
            { id: 'friend', text: '📱 A friend' },
            { id: 'family', text: '👨‍👩‍👧 Family' },
            { id: 'new', text: '👋 Someone new' },
            { id: 'not_sure', text: '❓ Not sure' }
          ],
          next_follow_up: {
            question: 'Cool. What do you want to say?',
            choices: [
              { id: 'just_hi', text: '👋 Just hi' },
              { id: 'ask_how', text: '🙂 Ask how they\'re doing' },
              { id: 'joke', text: '😂 Share a joke/emoji' },
              { id: 'not_sure', text: '❓ Not sure' }
            ]
          }
        }
      },
      coffee_meet: {
        id: 'coffee_meet',
        text: '☕ Ask someone to grab coffee/tea',
        follow_up: {
          question: 'Great! Who could you ask?',
          choices: [
            { id: 'friend', text: '☕ A close friend' },
            { id: 'colleague', text: '👩‍🏫 Classmate/colleague' },
            { id: 'family', text: '👨‍👩 Family' },
            { id: 'not_sure', text: '❓ Not sure' }
          ],
          next_follow_up: {
            question: 'When do you want to do it?',
            choices: [
              { id: 'this_week', text: '📅 This week' },
              { id: 'next_week', text: '📅 Next week' },
              { id: 'not_sure', text: '⏸ Not sure yet' }
            ]
          }
        }
      },
      share_meme: {
        id: 'share_meme',
        text: '📨 Share a funny meme',
        follow_up: {
          question: 'Fun! Who would enjoy it?',
          choices: [
            { id: 'friend', text: '😂 A friend' },
            { id: 'group_chat', text: '👥 Group chat' },
            { id: 'family', text: '👨‍👩‍👧 Family' },
            { id: 'not_sure', text: '❓ Not sure' }
          ]
        }
      }
    },
    explain_examples: {
      send_hi_text: ['📱 Friend → just a quick hello.', '👨‍👩 Family → simple check-in message.', '👋 Someone new → a friendly intro.'],
      coffee_meet: ['☕ Friend → casual hangout time.', '👩‍🏫 Colleague → get to know them better.', '👨‍👩 Family → quality time together.'],
      share_meme: ['😂 Friend → something they\'d find funny.', '👥 Group chat → lighten the mood.', '👨‍👩‍👧 Family → share a laugh together.']
    }
  },
  create: {
    options: {
      doodle: {
        id: 'doodle',
        text: '🖊️ Doodle for 5 minutes',
        follow_up: {
          question: 'Fun! What will you doodle?',
          choices: [
            { id: 'shapes', text: '✏️ Shapes or patterns' },
            { id: 'animals', text: '🐱 Animals' },
            { id: 'faces', text: '🙂 Faces' },
            { id: 'not_sure', text: '❓ Not sure' }
          ],
          next_follow_up: {
            question: 'When do you want to doodle?',
            choices: [
              { id: 'now', text: '🕑 Right now' },
              { id: 'later', text: '🌙 Later today' },
              { id: 'week', text: '📅 This week' },
              { id: 'not_sure', text: '❓ Not sure' }
            ]
          }
        }
      },
      playlist: {
        id: 'playlist',
        text: '🎵 Make a short playlist',
        follow_up: {
          question: 'Cool! What mood of music?',
          choices: [
            { id: 'chill', text: '🎶 Chill' },
            { id: 'energetic', text: '🔥 Energetic' },
            { id: 'happy', text: '🙂 Happy' },
            { id: 'not_sure', text: '❓ Not sure' }
          ],
          next_follow_up: {
            question: 'How many songs do you want to add?',
            choices: [
              { id: '2to3', text: '2–3 songs' },
              { id: '5plus', text: '5+ songs' },
              { id: 'not_sure', text: '❓ Not sure' }
            ]
          }
        }
      },
      take_photo: {
        id: 'take_photo',
        text: '📸 Take a photo of something you like',
        follow_up: {
          question: 'Cool! What do you want to photograph?',
          choices: [
            { id: 'nature', text: '🌿 Something in nature' },
            { id: 'art', text: '🎨 Art or design' },
            { id: 'everyday', text: '✨ Something everyday but cool' },
            { id: 'not_sure', text: '❓ Not sure' }
          ]
        }
      }
    },
    explain_examples: {
      doodle: ['✏️ Shapes → simple lines or patterns.', '🐱 Animals → any creature you like.', '🙂 Faces → sketch emotions or expressions.'],
      playlist: ['🎶 Chill → relaxing vibes.', '🔥 Energetic → pump you up.', '🙂 Happy → songs that make you smile.'],
      take_photo: ['🌿 Nature → flowers, sky, trees.', '🎨 Art → cool patterns or colors.', '✨ Everyday → find beauty in ordinary things.']
    }
  }
};

export const SuggestionEngine: React.FC<SuggestionEngineProps> = ({
  category,
  onSelectOption,
  onMetaAction
}) => {
  const [currentOptionSet, setCurrentOptionSet] = useState(0);
  const [notSureCount, setNotSureCount] = useState(0);
  const [explainMode, setExplainMode] = useState(false);
  const [shownOptions, setShownOptions] = useState<Set<string>>(new Set());
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUp | null>(null);
  const [selectedOption, setSelectedOption] = useState<SuggestionOption | null>(null);

  const categoryData = SUGGESTION_POOLS[category];
  
  useEffect(() => {
    // Reset state when category changes
    setCurrentOptionSet(0);
    setNotSureCount(0);
    setExplainMode(false);
    setShownOptions(new Set());
    setCurrentFollowUp(null);
    setSelectedOption(null);
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

  const optionIds = Object.keys(categoryData.options);
  const optionsPerSet = 3;
  
  const getCurrentOptions = () => {
    const startIndex = currentOptionSet * optionsPerSet;
    const currentIds = optionIds.slice(startIndex, startIndex + optionsPerSet);
    return currentIds.map(id => categoryData.options[id]);
  };

  const handleOptionSelect = (option: SuggestionOption) => {
    setSelectedOption(option);
    if (option.follow_up) {
      setCurrentFollowUp(option.follow_up);
    } else {
      onSelectOption(option);
    }
  };

  const handleFollowUpSelect = (choice: FollowUpChoice) => {
    if (choice.id === 'not_sure') {
      handleNotSure();
      return;
    }

    if (currentFollowUp?.next_follow_up) {
      setCurrentFollowUp(currentFollowUp.next_follow_up);
    } else {
      // Final selection - create complete goal
      if (selectedOption) {
        onSelectOption(selectedOption);
      }
    }
  };

  const handleNotSure = () => {
    const newNotSureCount = notSureCount + 1;
    setNotSureCount(newNotSureCount);

    if (newNotSureCount === 1) {
      // First "Not sure" - show next set of options
      const nextSet = (currentOptionSet + 1) % Math.ceil(optionIds.length / optionsPerSet);
      setCurrentOptionSet(nextSet);
      setCurrentFollowUp(null);
      setSelectedOption(null);
    } else if (newNotSureCount === 2) {
      // Second "Not sure" - enter explain mode
      setExplainMode(true);
      setCurrentFollowUp(null);
      setSelectedOption(null);
    } else {
      // Third+ "Not sure" - show meta options
      // This will be handled by showing meta options in render
    }
  };

  const getCategoryPrompt = () => {
    switch (category) {
      case 'health':
        return "Here are a few ideas for health goals. Which one feels doable?";
      case 'learning':
        return "Want to pick a quick learning goal?";
      case 'social':
        return "Here are some easy social goals. What do you think?";
      case 'create':
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

  // Show follow-up questions
  if (currentFollowUp) {
    return (
      <div className="space-y-4">
        <p className="text-foreground">{currentFollowUp.question}</p>
        
        <div className="flex flex-wrap gap-2">
          {currentFollowUp.choices.map((choice) => (
            <Button
              key={choice.id}
              variant="outline"
              onClick={() => handleFollowUpSelect(choice)}
              className="flex items-center gap-2 text-left h-auto p-3 whitespace-normal"
            >
              {choice.text}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const currentOptions = getCurrentOptions();
  
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
            onClick={() => handleOptionSelect(option)}
            className="flex items-center gap-2 text-left h-auto p-3 whitespace-normal"
          >
            <div className="flex flex-col items-start">
              <span>{option.text}</span>
              {explainMode && categoryData.explain_examples[option.id] && (
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  {categoryData.explain_examples[option.id].map((example, index) => (
                    <div key={index}>→ {example}</div>
                  ))}
                </div>
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
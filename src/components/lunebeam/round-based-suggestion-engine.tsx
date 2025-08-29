import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RoundBasedSuggestionEngineProps {
  category: string;
  onSelectOption: (option: any) => void;
  onMetaAction: (action: 'new_ideas' | 'explain' | 'write_own' | 'pause' | 'exit') => void;
}

interface OptionData {
  id: string;
  text: string;
  followUp?: {
    question: string;
    options: { id: string; text: string }[];
  };
}

interface CategoryRounds {
  round1: OptionData[];
  round2: OptionData[];
  round3?: OptionData[];
  explainMode: Record<string, string[]>;
}

const CATEGORY_DATA: Record<string, CategoryRounds> = {
  health: {
    round1: [
      {
        id: 'walk',
        text: '🚶 Walk',
        followUp: {
          question: 'Where do you want to walk?',
          options: [
            { id: 'outside', text: '🌳 Outside' },
            { id: 'school', text: '🏫 At school/work' },
            { id: 'inside', text: '🚶 Inside' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'snack',
        text: '🥗 Try a snack',
        followUp: {
          question: 'What sounds good?',
          options: [
            { id: 'fruit', text: '🍎 Fruit' },
            { id: 'veggie', text: '🥕 Veggie' },
            { id: 'healthy', text: '🥜 Healthy snack' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'sleep',
        text: '😴 Sleep 15 min earlier',
        followUp: {
          question: 'When do you usually sleep?',
          options: [
            { id: 'early', text: '🌅 Early (before 10pm)' },
            { id: 'normal', text: '🌙 Normal (10-11pm)' },
            { id: 'late', text: '🌛 Late (after 11pm)' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    round2: [
      {
        id: 'water',
        text: '💧 Extra water',
        followUp: {
          question: 'How much water do you usually drink?',
          options: [
            { id: 'little', text: '💧 A little' },
            { id: 'some', text: '💧💧 Some' },
            { id: 'lots', text: '💧💧💧 Lots' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'stretch',
        text: '🧘 Stretch 5 min',
        followUp: {
          question: 'When do you want to stretch?',
          options: [
            { id: 'morning', text: '🌅 Morning' },
            { id: 'afternoon', text: '☀️ Afternoon' },
            { id: 'evening', text: '🌙 Evening' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'dance',
        text: '🎶 Dance to one song',
        followUp: {
          question: 'What music do you like?',
          options: [
            { id: 'upbeat', text: '⚡ Upbeat' },
            { id: 'calm', text: '🎵 Calm' },
            { id: 'favorite', text: '❤️ My favorite' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    explainMode: {
      walk: ['🌳 Outside → 5 min counts.', '🧘 Stretch → quick reset.', '🎶 Dance → fav track.'],
      snack: ['🍎 Fruit → something sweet.', '🥕 Veggie → crunchy and good.', '🥜 Healthy → nuts or yogurt.'],
      sleep: ['😴 Earlier → even 15 min helps.', '🌙 Routine → same time each night.']
    }
  },
  education: {
    round1: [
      {
        id: 'read',
        text: '📖 Read 1 page',
        followUp: {
          question: 'When do you want to read?',
          options: [
            { id: 'now', text: '🕑 Now' },
            { id: 'bed', text: '🌙 Before bed' },
            { id: 'later', text: '📅 Later' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'write',
        text: '✍️ Write 1 sentence',
        followUp: {
          question: 'What will you write about?',
          options: [
            { id: 'homework', text: '📝 Homework' },
            { id: 'journal', text: '📓 Journal' },
            { id: 'idea', text: '💡 Random idea' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'schedule',
        text: '📅 Review schedule',
        followUp: {
          question: 'Which schedule?',
          options: [
            { id: 'today', text: '📅 Today' },
            { id: 'week', text: '🗓️ This week' },
            { id: 'month', text: '🗓️ This month' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    round2: [
      {
        id: 'problem',
        text: '🧩 Solve 1 problem',
        followUp: {
          question: 'What kind of problem?',
          options: [
            { id: 'math', text: '🔢 Math' },
            { id: 'puzzle', text: '🧩 Logic puzzle' },
            { id: 'homework', text: '📚 Homework' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'notes',
        text: '📝 Review notes',
        followUp: {
          question: 'Which notes?',
          options: [
            { id: 'today', text: '📝 Today\'s' },
            { id: 'recent', text: '📚 Recent' },
            { id: 'important', text: '⭐ Important' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'video',
        text: '🎧 Short study video',
        followUp: {
          question: 'What topic?',
          options: [
            { id: 'subject', text: '📚 My subject' },
            { id: 'skill', text: '🛠️ New skill' },
            { id: 'interest', text: '🎯 My interest' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    explainMode: {
      read: ['📖 Page = one page.', '✍️ Sentence = one line.', '📅 Schedule = quick glance.'],
      write: ['✍️ Sentence = just one line.', '📝 Homework = small part.', '📓 Journal = your thoughts.'],
      schedule: ['📅 Review = quick look.', '🗓️ Week = what\'s coming.', '📝 Plan = small steps.']
    }
  },
  employment: {
    round1: [
      {
        id: 'interview',
        text: '💼 Practice 1 interview Q',
        followUp: {
          question: 'Which type of question?',
          options: [
            { id: 'basic', text: '💬 Basic ("Tell me about yourself")' },
            { id: 'skills', text: '🧠 Skills' },
            { id: 'experience', text: '📝 Experience' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'resume',
        text: '🧑‍💻 Update resume line',
        followUp: {
          question: 'Which part to edit?',
          options: [
            { id: 'skills', text: '✏️ Skill' },
            { id: 'education', text: '🎓 Education' },
            { id: 'experience', text: '💼 Experience' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'email',
        text: '📬 Send 1 email',
        followUp: {
          question: 'What kind of email?',
          options: [
            { id: 'application', text: '📝 Job application' },
            { id: 'followup', text: '📞 Follow-up' },
            { id: 'networking', text: '🤝 Networking' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    round2: [
      {
        id: 'outfit',
        text: '👔 Try a work outfit',
        followUp: {
          question: 'For what kind of work?',
          options: [
            { id: 'office', text: '🏢 Office' },
            { id: 'casual', text: '👕 Casual' },
            { id: 'service', text: '👩‍🍳 Service' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'organize',
        text: '🗂️ Organize folder',
        followUp: {
          question: 'Which folder?',
          options: [
            { id: 'resumes', text: '📝 Resumes' },
            { id: 'applications', text: '📋 Applications' },
            { id: 'contacts', text: '📞 Contacts' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'job_idea',
        text: '📝 Write 1 job idea',
        followUp: {
          question: 'What interests you?',
          options: [
            { id: 'skills', text: '🛠️ Using my skills' },
            { id: 'people', text: '👥 Working with people' },
            { id: 'creative', text: '🎨 Being creative' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    explainMode: {
      interview: ['💼 Interview → answer 1 Q.', '🧑‍💻 Resume → tweak 1 line.', '📬 Email → short hello.'],
      resume: ['✏️ Skill → add one new skill.', '🎓 Education → update info.', '💼 Experience → describe briefly.'],
      email: ['📝 Application → short intro.', '📞 Follow-up → quick thank you.', '🤝 Network → friendly hello.']
    }
  },
  independent_living: {
    round1: [
      {
        id: 'bed',
        text: '🛏️ Make bed',
        followUp: {
          question: 'How do you usually make it?',
          options: [
            { id: 'simple', text: '🛏️ Just straighten' },
            { id: 'neat', text: '📐 Neat and tidy' },
            { id: 'perfect', text: '⭐ Perfect' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'table',
        text: '🍽️ Set table',
        followUp: {
          question: 'For how many people?',
          options: [
            { id: 'one', text: '1️⃣ Just me' },
            { id: 'two', text: '2️⃣ Two people' },
            { id: 'family', text: '👨‍👩‍👧 Family' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'laundry',
        text: '🧺 Laundry to basket',
        followUp: {
          question: 'What kind of laundry?',
          options: [
            { id: 'dirty', text: '👕 Dirty clothes' },
            { id: 'clean', text: '🧺 Clean clothes' },
            { id: 'sort', text: '🗂️ Sort by color' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    round2: [
      {
        id: 'cook',
        text: '🍳 Cook snack',
        followUp: {
          question: 'What kind of snack?',
          options: [
            { id: 'simple', text: '🍞 Simple (toast)' },
            { id: 'fruit', text: '🍎 Fruit bowl' },
            { id: 'warm', text: '🔥 Something warm' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'tidy',
        text: '🧹 Tidy area',
        followUp: {
          question: 'Which area?',
          options: [
            { id: 'desk', text: '🖥️ Desk' },
            { id: 'room', text: '🛏️ Room' },
            { id: 'kitchen', text: '🍳 Kitchen' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'list',
        text: '🛒 Write list',
        followUp: {
          question: 'What add?',
          options: [
            { id: 'fruit', text: '🍎 Fruit' },
            { id: 'milk', text: '🥛 Milk' },
            { id: 'bread', text: '🍞 Bread' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    explainMode: {
      bed: ['🛏️ Bed → straighten blanket.', '🍽️ Table → add forks.', '🧺 Laundry → basket only.'],
      table: ['🍽️ Table → plates and forks.', '🥛 Drinks → water or juice.', '🍽️ Simple → just the basics.'],
      laundry: ['🧺 Basket → just put in basket.', '👕 Clothes → dirty ones only.', '🗂️ Sort → by color.']
    }
  },
  social_skills: {
    round1: [
      {
        id: 'hi',
        text: '👋 Say "hi"',
        followUp: {
          question: 'Who to say hi to?',
          options: [
            { id: 'family', text: '👨‍👩 Family' },
            { id: 'friend', text: '📱 Friend' },
            { id: 'teacher', text: '👩‍🏫 Teacher' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'eye_contact',
        text: '🙂 Eye contact 3s',
        followUp: {
          question: 'Who to practice with?',
          options: [
            { id: 'family', text: '👨‍👩 Family' },
            { id: 'friend', text: '📱 Friend' },
            { id: 'teacher', text: '👩‍🏫 Teacher' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'text',
        text: '📱 Text "how are you?"',
        followUp: {
          question: 'Who to text?',
          options: [
            { id: 'family', text: '👨‍👩 Family' },
            { id: 'friend', text: '📱 Friend' },
            { id: 'teacher', text: '👩‍🏫 Teacher' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    round2: [
      {
        id: 'roleplay',
        text: '🗣️ Role-play intro',
        followUp: {
          question: 'What kind of intro?',
          options: [
            { id: 'casual', text: '😊 Casual ("Hey, I\'m...")' },
            { id: 'formal', text: '🤝 Formal ("Hello, my name is...")' },
            { id: 'fun', text: '🎉 Fun with a hobby' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'handshake',
        text: '🤝 Handshake/fist bump',
        followUp: {
          question: 'Which do you prefer?',
          options: [
            { id: 'handshake', text: '🤝 Handshake' },
            { id: 'fist_bump', text: '👊 Fist bump' },
            { id: 'wave', text: '👋 Wave' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'compliment',
        text: '💬 Compliment',
        followUp: {
          question: 'Who to compliment?',
          options: [
            { id: 'family', text: '👨‍👩 Family' },
            { id: 'friend', text: '📱 Friend' },
            { id: 'teacher', text: '👩‍🏫 Teacher' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    explainMode: {
      hi: ['👋 Hi → wave.', '🙂 Eye contact → 3s only.', '📱 Text → short hello.'],
      eye_contact: ['🙂 Eye contact → look for 3 seconds.', '👋 Wave → friendly gesture.', '😊 Smile → makes it easier.'],
      text: ['📱 Text → "How are you?"', '💬 Message → keep it simple.', '😊 Friendly → show you care.']
    }
  },
  housing: {
    round1: [
      {
        id: 'browse',
        text: '🏠 Browse housing option',
        followUp: {
          question: 'What type of housing?',
          options: [
            { id: 'apartment', text: '🏠 Apartment' },
            { id: 'shared', text: '👥 Shared housing' },
            { id: 'assisted', text: '🏘️ Assisted living' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'list',
        text: '📋 List wants/needs',
        followUp: {
          question: 'What\'s most important?',
          options: [
            { id: 'bedroom', text: '🛏 Bedroom' },
            { id: 'transit', text: '🚌 Transit' },
            { id: 'stores', text: '🛒 Stores' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'call',
        text: '📞 Call housing office',
        followUp: {
          question: 'What do you want to ask?',
          options: [
            { id: 'availability', text: '🏠 Availability' },
            { id: 'price', text: '💰 Price' },
            { id: 'features', text: '📋 Features' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    round2: [
      {
        id: 'funding',
        text: '📑 Read funding info',
        followUp: {
          question: 'What kind of funding?',
          options: [
            { id: 'government', text: '🏛️ Government' },
            { id: 'voucher', text: '🎫 Housing voucher' },
            { id: 'disability', text: '♿ Disability support' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'documents',
        text: '🗂 Gather 1 doc',
        followUp: {
          question: 'Which document?',
          options: [
            { id: 'id', text: '🆔 ID' },
            { id: 'income', text: '💰 Income proof' },
            { id: 'references', text: '📝 References' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'explore',
        text: '🗺 Explore area',
        followUp: {
          question: 'How do you want to explore?',
          options: [
            { id: 'walk', text: '🚶 Walk around' },
            { id: 'drive', text: '🚗 Drive through' },
            { id: 'online', text: '💻 Look online' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    explainMode: {
      browse: ['🏠 Option → 1 listing.', '📋 List → jot 3 things.', '📞 Call → ask 1 Q.'],
      list: ['🛏 Bedroom → how many rooms.', '🚌 Transit → bus/train access.', '🛒 Stores → grocery nearby.'],
      call: ['📞 Call → one simple question.', '🏠 Availability → when can I move in.', '💰 Price → monthly cost.']
    }
  },
  postsecondary: {
    round1: [
      {
        id: 'program',
        text: '📝 Look at 1 program',
        followUp: {
          question: 'What type of program?',
          options: [
            { id: 'college', text: '🎓 College' },
            { id: 'trade', text: '🔧 Trade school' },
            { id: 'certificate', text: '📜 Certificate' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'disability',
        text: '💻 Visit disability office site',
        followUp: {
          question: 'What do you want to learn about?',
          options: [
            { id: 'accommodations', text: '♿ Accommodations' },
            { id: 'support', text: '🤝 Support services' },
            { id: 'contact', text: '📞 Contact info' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'story',
        text: '🎧 Student story',
        followUp: {
          question: 'What kind of story?',
          options: [
            { id: 'success', text: '⭐ Success story' },
            { id: 'disability', text: '♿ Disability experience' },
            { id: 'program', text: '📚 Program experience' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    round2: [
      {
        id: 'visit',
        text: '🏫 Plan campus visit',
        followUp: {
          question: 'Who with?',
          options: [
            { id: 'family', text: '👨‍👩 Family' },
            { id: 'friend', text: '🧑 Friend' },
            { id: 'teacher', text: '👩‍🏫 Teacher' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'supports',
        text: '📑 Review supports',
        followUp: {
          question: 'What kind of supports?',
          options: [
            { id: 'academic', text: '📚 Academic' },
            { id: 'financial', text: '💰 Financial' },
            { id: 'disability', text: '♿ Disability' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      },
      {
        id: 'timeline',
        text: '📅 Write app timeline',
        followUp: {
          question: 'When do you want to apply?',
          options: [
            { id: 'next_year', text: '📅 Next year' },
            { id: 'this_year', text: '📅 This year' },
            { id: 'future', text: '🔮 Future' },
            { id: 'not_sure', text: '❓ Not sure' },
            { id: 'exit', text: '🚪 Exit' }
          ]
        }
      }
    ],
    explainMode: {
      program: ['📝 Program → 1 brochure.', '💻 Disability office → check supports.', '🎧 Story → 3min video.'],
      visit: ['🏫 Visit → tour the campus.', '👨‍👩 Family → bring support person.', '📅 Plan → pick a date.'],
      supports: ['📚 Academic → tutoring, notes.', '💰 Financial → grants, loans.', '♿ Disability → accommodations.']
    }
  }
};

export const RoundBasedSuggestionEngine: React.FC<RoundBasedSuggestionEngineProps> = ({
  category,
  onSelectOption,
  onMetaAction
}) => {
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
  const [followUpStep, setFollowUpStep] = useState<'question' | 'selected' | null>(null);
  const [notSureCount, setNotSureCount] = useState(0);
  const [showExplainMode, setShowExplainMode] = useState(false);
  const [showMetaOptions, setShowMetaOptions] = useState(false);

  const categoryData = CATEGORY_DATA[category];
  if (!categoryData) return null;

  const currentOptions = currentRound === 1 ? categoryData.round1 : categoryData.round2;

  const handleOptionSelect = (option: OptionData) => {
    setSelectedOption(option);
    if (option.followUp) {
      setFollowUpStep('question');
    } else {
      // Option has no follow-up, create goal directly
      onSelectOption({
        id: option.id,
        text: option.text,
        category: category
      });
    }
  };

  const handleFollowUpSelect = (choiceId: string) => {
    if (choiceId === 'exit') {
      onMetaAction('exit');
      return;
    }
    
    if (choiceId === 'not_sure') {
      const newCount = notSureCount + 1;
      setNotSureCount(newCount);
      
      if (newCount >= 2 && !showExplainMode) {
        setShowExplainMode(true);
      } else if (newCount >= 3) {
        setShowMetaOptions(true);
      }
      return;
    }

    // Complete the selection
    if (selectedOption) {
      onSelectOption({
        id: selectedOption.id,
        text: selectedOption.text,
        category: category,
        followUpChoice: choiceId
      });
    }
  };

  const handleNotSure = () => {
    const newCount = notSureCount + 1;
    setNotSureCount(newCount);
    
    if (newCount >= 2 && !showExplainMode) {
      setShowExplainMode(true);
    } else if (newCount >= 3) {
      setShowMetaOptions(true);
    }
  };

  const handleExit = () => {
    onMetaAction('exit');
  };

  if (showMetaOptions) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-4">All good 👍 Want to...</p>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('new_ideas')}
            className="w-full justify-start"
          >
            🔄 See new ideas
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('explain')}
            className="w-full justify-start"
          >
            📖 Explain more
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('write_own')}
            className="w-full justify-start"
          >
            ✏️ Write my own
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('pause')}
            className="w-full justify-start"
          >
            ⏸ Pause
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onMetaAction('exit')}
            className="w-full justify-start"
          >
            🚪 Exit
          </Button>
        </div>
      </Card>
    );
  }

  if (showExplainMode && selectedOption) {
    const explanations = categoryData.explainMode[selectedOption.id] || [];
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-4">Here's what these mean:</p>
        <div className="space-y-2 mb-4">
          {explanations.map((explanation, index) => (
            <p key={index} className="text-sm">{explanation}</p>
          ))}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowExplainMode(false)}
            className="flex-1"
          >
            Got it
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExit}
            className="flex-1"
          >
            🚪 Exit
          </Button>
        </div>
      </Card>
    );
  }

  if (selectedOption && followUpStep === 'question' && selectedOption.followUp) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-4">{selectedOption.followUp.question}</p>
        <div className="space-y-2">
          {selectedOption.followUp.options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              onClick={() => handleFollowUpSelect(option.id)}
              className="w-full justify-start text-left"
            >
              {option.text}
            </Button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Round {currentRound}</p>
        {currentRound === 1 && categoryData.round2 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentRound(2)}
          >
            Round 2 →
          </Button>
        )}
        {currentRound === 2 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentRound(1)}
          >
            ← Round 1
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {currentOptions.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            onClick={() => handleOptionSelect(option)}
            className="w-full justify-start text-left"
          >
            {option.text}
          </Button>
        ))}
        
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={handleNotSure}
            className="flex-1"
          >
            ❓ Not sure
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExit}
            className="flex-1"
          >
            🚪 Exit
          </Button>
        </div>
      </div>
    </Card>
  );
};
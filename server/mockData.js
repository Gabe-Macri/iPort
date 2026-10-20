/**
 * Realistic mock data for demo mode or initial testing before Full Disk Access is configured.
 */

const now = Date.now();
const min = 60 * 1000;
const hour = 60 * min;
const day = 24 * hour;

export const mockChats = [
  {
    chat_id: 101,
    guid: 'iMessage;+;chat482910482019',
    chat_identifier: 'chat482910482019',
    display_name: 'The Dinner Crew 🍕',
    service_name: 'iMessage',
    is_group: true,
    is_pinned: true,
    participants: [
      { id: '+14155552671', name: 'Sophia Chen' },
      { id: '+14155558932', name: 'Marcus Vance' },
      { id: '+14155554109', name: 'Elena Rostova' }
    ],
    last_message: {
      text: "Table is reserved for 7:30! Let's meet out front.",
      date: now - 3 * min,
      is_from_me: 0,
      sender: '+14155552671',
      status: null,
      read_at: null
    },
    unread_count: 1
  },
  {
    chat_id: 102,
    guid: 'iMessage;-;alex.miller@example.com',
    chat_identifier: 'alex.miller@example.com',
    display_name: 'Alex Miller',
    service_name: 'iMessage',
    is_group: false,
    is_pinned: true,
    participants: [
      { id: 'alex.miller@example.com', name: 'Alex Miller' }
    ],
    last_message: {
      text: "Just sent the design files over. Let me know what you think!",
      date: now - 25 * min,
      is_from_me: 0,
      sender: 'alex.miller@example.com',
      status: null,
      read_at: null
    },
    unread_count: 0
  },
  {
    chat_id: 103,
    guid: 'SMS;-;+14155559812',
    chat_identifier: '+14155559812',
    display_name: 'Sarah Jenkins',
    service_name: 'SMS',
    is_group: false,
    is_pinned: false,
    participants: [
      { id: '+14155559812', name: 'Sarah Jenkins' }
    ],
    last_message: {
      text: "Thanks! See you tomorrow morning.",
      date: now - 2 * hour,
      is_from_me: 1,
      sender: null,
      status: 'delivered',
      read_at: null,
      delivered_at: now - 119 * min
    },
    unread_count: 0
  },
  {
    chat_id: 104,
    guid: 'iMessage;-;+14155553321',
    chat_identifier: '+14155553321',
    display_name: 'David Kim',
    service_name: 'iMessage',
    is_group: false,
    is_pinned: false,
    participants: [
      { id: '+14155553321', name: 'David Kim' }
    ],
    last_message: {
      text: "Check out this screenshot from the new build",
      date: now - 1 * day,
      is_from_me: 0,
      sender: '+14155553321',
      status: null,
      read_at: null
    },
    unread_count: 0
  }
];

export const mockMessages = {
  101: [
    {
      id: 1001,
      guid: 'msg-1001',
      chat_id: 101,
      text: "Hey everyone! Where are we thinking for Friday dinner?",
      date: now - 50 * min,
      is_from_me: 0,
      sender: '+14155558932',
      service: 'iMessage',
      status: null,
      read_at: null,
      reactions: []
    },
    {
      id: 1002,
      guid: 'msg-1002',
      chat_id: 101,
      text: "How about that new wood-fired pizza spot in North Beach?",
      date: now - 45 * min,
      is_from_me: 1,
      sender: null,
      service: 'iMessage',
      status: 'read',
      read_at: now - 41 * min,
      reactions: [
        { type: 2000, emoji: '❤️', sender: '+14155552671' },
        { type: 2001, emoji: '👍', sender: '+14155554109' }
      ]
    },
    {
      id: 1003,
      guid: 'msg-1003',
      chat_id: 101,
      text: "Oh I love that place! Their spicy honey burrata pizza is incredible.",
      date: now - 38 * min,
      is_from_me: 0,
      sender: '+14155554109',
      service: 'iMessage',
      status: null,
      read_at: null,
      reactions: []
    },
    {
      id: 1004,
      guid: 'msg-1004',
      chat_id: 101,
      text: "Should I book a table for 7:30?",
      date: now - 20 * min,
      is_from_me: 0,
      sender: '+14155552671',
      service: 'iMessage',
      status: null,
      read_at: null,
      reactions: []
    },
    {
      id: 1005,
      guid: 'msg-1005',
      chat_id: 101,
      text: "Yes please, that time is perfect for me!",
      date: now - 15 * min,
      is_from_me: 1,
      sender: null,
      service: 'iMessage',
      status: 'read',
      read_at: now - 12 * min,
      reactions: []
    },
    {
      id: 1006,
      guid: 'msg-1006',
      chat_id: 101,
      text: "Table is reserved for 7:30! Let's meet out front.",
      date: now - 3 * min,
      is_from_me: 0,
      sender: '+14155552671',
      service: 'iMessage',
      status: null,
      read_at: null,
      reactions: [
        { type: 2001, emoji: '👍', sender: 'me' }
      ]
    }
  ],
  102: [
    {
      id: 2001,
      guid: 'msg-2001',
      chat_id: 102,
      text: "Hey! Working on the updated iPort interface concepts right now.",
      date: now - 2 * hour,
      is_from_me: 1,
      sender: null,
      service: 'iMessage',
      status: 'read',
      read_at: now - 105 * min,
      reactions: []
    },
    {
      id: 2002,
      guid: 'msg-2002',
      chat_id: 102,
      text: "Awesome, can't wait to see it. Making sure it has high contrast dark mode too?",
      date: now - 90 * min,
      is_from_me: 0,
      sender: 'alex.miller@example.com',
      service: 'iMessage',
      status: null,
      read_at: null,
      reactions: []
    },
    {
      id: 2003,
      guid: 'msg-2003',
      chat_id: 102,
      text: "Definitely. Deep blacks, crisp SF typography, fluid animations, and zero-latency WebSocket/SSE updates.",
      date: now - 60 * min,
      is_from_me: 1,
      sender: null,
      service: 'iMessage',
      status: 'read',
      read_at: now - 45 * min,
      reactions: [
        { type: 2004, emoji: '‼️', sender: 'alex.miller@example.com' }
      ]
    },
    {
      id: 2004,
      guid: 'msg-2004',
      chat_id: 102,
      text: "Just sent the design files over. Let me know what you think!",
      date: now - 25 * min,
      is_from_me: 0,
      sender: 'alex.miller@example.com',
      service: 'iMessage',
      status: null,
      read_at: null,
      reactions: []
    }
  ],
  103: [
    {
      id: 3001,
      guid: 'msg-3001',
      chat_id: 103,
      text: "Hi! Confirming our coffee meeting tomorrow at 9 AM?",
      date: now - 3 * hour,
      is_from_me: 0,
      sender: '+14155559812',
      service: 'SMS',
      status: null,
      read_at: null,
      reactions: []
    },
    {
      id: 3002,
      guid: 'msg-3002',
      chat_id: 103,
      text: "Thanks! See you tomorrow morning.",
      date: now - 2 * hour,
      is_from_me: 1,
      sender: null,
      service: 'SMS',
      status: 'delivered',
      delivered_at: now - 118 * min,
      read_at: null,
      reactions: []
    }
  ],
  104: [
    {
      id: 4001,
      guid: 'msg-4001',
      chat_id: 104,
      text: "Check out this screenshot from the new build",
      date: now - 1 * day,
      is_from_me: 0,
      sender: '+14155553321',
      service: 'iMessage',
      status: null,
      read_at: null,
      attachments: [
        {
          id: 99,
          mime_type: 'image/svg+xml',
          transfer_name: 'mock_preview.svg',
          total_bytes: 4096,
          mockUrl: '/favicon.svg'
        }
      ],
      reactions: []
    }
  ]
};

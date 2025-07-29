import { LayoutConfig } from '@/types/layout';
import { LayoutGrid, Megaphone, PanelLeft, PanelRight, Menu, Columns2Icon } from 'lucide-react';

// Layout JSON configurations
const LAYOUT_CONFIGS = {
  'left-sidebar': {
    "name": "LeftSidebar@v1",
    "template": {
      "type": "grid",
      "id": "left-sidebar-grid",
      "props": {
        "className": "min-h-[inherit] max-h-[inherit] grid grid-cols-1 md:grid-cols-[400px_1fr] h-full w-full bg-transparent"
      },
      "children": [
        {
          "type": "box",
          "id": "sidebar_box",
          "props": {
            "className": "max-h-[inherit] h-full overflow-y-auto bg-gray-50 border-r"
          },
          "children": [
            {
              "type": "flex",
              "id": "sidebar-flex",
              "props": {
                "className": "flex flex-col h-full bg-transparent"
              },
              "children": [
                {
                  "id": "title",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6"
                  }
                },
                {
                  "id": "content",
                  "type": "flex",
                  "props": {
                    "className": "flex flex-col flex-grow space-y-2 p-6"
                  }
                },
                {
                  "id": "action",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6 mt-auto"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "box",
          "id": "promo_box",
          "props": {
            "className": "max-h-[inherit] h-full overflow-y-auto bg-transparent"
          },
          "children": [
            {
              "type": "flex",
              "id": "main-content-flex",
              "props": {
                "className": "flex flex-col h-full bg-transparent"
              },
              "children": [
                {
                  "type": "flex",
                  "id": "main-header",
                  "props": {
                    "className": "flex flex-col flex-grow overflow-y-auto bg-transparent"
                  },
                  "children": [
                    {
                      "id": "promo_header",
                      "type": "box",
                      "props": {
                        "className": "flex flex-col space-y-1 p-6"
                      }
                    },
                    {
                      "id": "promo_content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow space-y-2 p-6 grow"
                      }
                    }
                  ]
                },
                {
                  "id": "promo_action",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6 shrink"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },

  'right-sidebar': {
    "name": "RightSidebar@v1",
    "template": {
      "type": "grid",
      "id": "right-sidebar-grid",
      "props": {
        "className": "min-h-[inherit] max-h-[inherit] grid grid-cols-1 md:grid-cols-[1fr_400px] h-full w-full bg-transparent"
      },
      "children": [
        {
          "type": "box",
          "id": "promo_box",
          "props": {
            "className": "max-h-[inherit] h-full overflow-y-auto bg-transparent"
          },
          "children": [
            {
              "type": "flex",
              "id": "main-content-flex",
              "props": {
                "className": "flex flex-col h-full bg-transparent"
              },
              "children": [
                {
                  "type": "flex",
                  "id": "main-header",
                  "props": {
                    "className": "flex flex-col flex-grow overflow-y-auto bg-transparent"
                  },
                  "children": [
                    {
                      "id": "promo_header",
                      "type": "box",
                      "props": {
                        "className": "flex flex-col space-y-1 p-6"
                      }
                    },
                    {
                      "id": "promo_content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow space-y-2 p-6 grow"
                      }
                    }
                  ]
                },
                {
                  "id": "promo_action",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6 shrink"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "box",
          "id": "sidebar_box",
          "props": {
            "className": "max-h-[inherit] h-full overflow-y-auto bg-gray-50 border-l"
          },
          "children": [
            {
              "type": "flex",
              "id": "sidebar-flex",
              "props": {
                "className": "flex flex-col h-full"
              },
              "children": [
                {
                  "id": "title",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6"
                  }
                },
                {
                  "id": "content",
                  "type": "flex",
                  "props": {
                    "className": "flex flex-col flex-grow space-y-2 p-6"
                  }
                },
                {
                  "id": "action",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6 mt-auto"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },

  'promo': {
    "name": "SplitCheckout@v1.1",
    "template": {
      "type": "grid",
      "id": "1x2-grid",
      "props": {
        "className": "min-h-[inherit] max-h-[inherit] grid grid-cols-1 md:grid-cols-2 h-full w-full bg-transparent"
      },
      "children": [
        {
          "type": "box",
          "id": "core-box",
          "props": {
            "className": "order-2 md:order-1 max-h-[inherit] h-full overflow-y-auto bg-transparent"
          },
          "children": [
            {
              "type": "flex",
              "id": "main_box",
              "props": {
                "className": "flex flex-col h-full"
              },
              "children": [
                {
                  "type": "flex",
                  "id": "header",
                  "props": {
                    "className": "flex flex-col flex-grow overflow-y-auto bg-transparent"
                  },
                  "children": [
                    {
                      "id": "title",
                      "type": "NavigationBar",
                      "props": {
                        "className": "flex flex-col space-y-1 p-6"
                      }
                    },
                    {
                      "id": "content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow space-y-2 p-6 grow"
                      }
                    }
                  ]
                },
                {
                  "id": "action",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6 shrink"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "box",
          "id": "promo_box",
          "props": {
            "className": "order-1 md:order-2 max-h-[inherit] h-auto md:h-full flex overflow-y-auto flex-col"
          },
          "children": [
            {
              "id": "promo_header",
              "type": "box",
              "props": {
                "className": "flex flex-col h-auto p-6"
              }
            },
            {
              "id": "promo_content",
              "type": "box",
              "props": {
                "className": "flex flex-col h-full flex flex-col flex-grow space-y-2 p-6 min-h-max"
              }
            }
          ]
        }
      ]
    }
  },

  'hamburger-split': {
    "name": "HamburgerSplit@v1",
    "template": {
      "type": "flex",
      "id": "hamburger-container",
      "props": {
        "className": "min-h-[inherit] max-h-[inherit] flex flex-col h-full w-full bg-transparent"
      },
      "children": [
        {
          "id": "header",
          "type": "box",
          "props": {
            "className": "flex flex-col w-full bg-white border-b p-4 bg-transparent"
          }
        },
        {
          "type": "grid",
          "id": "middle-grid",
          "props": {
            "className": "max-h-[inherit] overflow-y-auto grid grid-cols-1 md:grid-cols-2 flex-grow h-full bg-transparent"
          },
          "children": [
            {
              "type": "box",
              "id": "main_box",
              "props": {
                "className": "flex flex-col h-full overflow-y-auto border-r bg-transparent"
              },
              "children": [
                {
                  "id": "title",
                  "type": "box",
                  "props": {
                    "className": "flex flex-col p-6"
                  }
                },
                {
                  "id": "content",
                  "type": "flex",
                  "props": {
                    "className": "flex flex-col flex-grow space-y-2 p-6 grow"
                  }
                }
              ]
            },
            {
              "type": "box",
              "id": "right-content",
              "props": {
                "className": "h-full flex flex-col overflow-y-auto bg-transparent"
              },
              "children": [
                {
                  "id": "promo_content",
                  "type": "flex",
                  "props": {
                    "className": "flex flex-col space-y-2 p-6 grow"
                  }
                }
              ]
            }
          ]
        },
        {
          "id": "footer",
          "type": "box",
          "props": {
            "className": "flex flex-col w-full bg-white border-t p-4 shrink"
          }

        }
      ]
    }
  },

  'full-width': {
    "name": "FullWidth@v1",
    "template": {
      "type": "flex",
      "id": "main_box",
      "props": {
        "className": "min-h-[inherit] max-h-[inherit] flex flex-col h-full w-full bg-transparent"
      },
      "children": [
        {
          "id": "header",
          "type": "box",
          "props": {
            "className": "flex flex-col w-full p-8 bg-transparent"
          }
        },
        {
          "id": "content",
          "type": "flex",
          "props": {
            "className": "flex flex-col flex flex-col flex-grow  overflow-y-auto space-y-4 px-8 grow"
          }
        },
        {
          "id": "footer",
          "type": "box",
          "props": {
            "className": "flex flex-col w-full p-8 mt-auto"
          }
        }
      ]
    }
  },

  'stripe-checkout': {
    "name": "StripeCheckout@v1",
    "template": {
      "type": "flex",
      "id": "stripe-checkout-outer",
      "props": {
        "className": "min-h-[inherit] max-h-[inherit] flex flex-col items-center justify-center h-full w-full bg-transparent"
      },
      "children": [
        {
          "type": "flex",
          "id": "stripe-bg-row",
          "props": {
            "className": "relative flex w-full min-h-full h-full"
          },
          "children": [
            {
              "type": "box",
              "id": "stripe_left",
              "props": {
                "className": "hidden md:block absolute left-0 top-0 h-full w-1/2  z-0"
              }
            },
            {
              "type": "box",
              "id": "stripe_right",
              "props": {
                "className": "hidden md:block absolute right-0 top-0 h-full w-1/2  z-0 border-l border-gray-200"
              }
            },
            {
              "type": "grid",
              "id": "stripe-checkout-grid",
              "props": {
                "className": "relative w-full max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 h-full min-h-full bg-transparent z-10"
              },
              "children": [
                {
                  "type": "box",
                  "id": "stripe_left_inner",
                  "props": {
                    "className": "relative flex flex-col h-full min-h-full bg-transparent"
                  },
                  "children": [
                    {
                      "id": "stripe_left_header",
                      "type": "box",
                      "props": {
                        "className": "flex flex-col w-full"
                      }
                    },
                    {
                      "id": "stripe_left_content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow w-full"
                      }
                    },
                    {
                      "id": "stripe_left_action",
                      "type": "box",
                      "props": {
                        "className": "sticky bottom-0 left-0 w-full flex flex-col bg-inherit"
                      }
                    }
                  ]
                },
                {
                  "type": "box",
                  "id": "stripe_right_inner",
                  "props": {
                    "className": "relative flex flex-col h-full min-h-full bg-transparent"
                  },
                  "children": [
                    {
                      "id": "stripe_right_content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow w-full"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
};

export const AVAILABLE_LAYOUTS: Record<string, LayoutConfig> = {
  'left-sidebar': {
    id: 'left-sidebar',
    name: 'Left Sidebar Layout',
    description: 'Classic layout with a left sidebar for navigation and main content area',
    icon: PanelLeft,
    layoutIdentifier: 'left-sidebar@v1',
    layoutConfig: LAYOUT_CONFIGS['left-sidebar'],
    exposed: [
      'sidebar_box',
      'title',
      'content',
      'action',
      'promo_box',
      'promo_header',
      'promo_content',
      'promo_action'
    ],
    sections: {
      // Container sections (presentation-only)
      'left-sidebar-grid': {
        asContainer: true,
        blocks: []
      },
      'sidebar_box': {
        asContainer: true,
        style: {
          backgroundColor: '#f9fafb',
        },
        blocks: []
      },
      'sidebar-flex': {
        asContainer: true,
        blocks: []
      },
      'promo_box': {
        asContainer: true,
        blocks: []
      },
      'main-content-flex': {
        asContainer: true,
        blocks: []
      },
      'main-header': {
        asContainer: true,
        blocks: []
      },
      // Content sections (block-droppable)
      title: {
        appearance: {
          padding: '24px'
        },
        blocks: []
      },
      content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
        },
        blocks: []
      },
      action: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
      promo_header: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
      promo_content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
        },
        blocks: []
      },
      promo_action: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
    }
  },
  'right-sidebar': {
    id: 'right-sidebar',
    name: 'Right Sidebar Layout',
    description: 'Classic layout with a right sidebar for navigation and main content area',
    icon: PanelRight,
    layoutIdentifier: 'right-sidebar@v1',
    layoutConfig: LAYOUT_CONFIGS['right-sidebar'],
    exposed: [
      'promo_box',
      'promo_header',
      'promo_content',
      'promo_action',
      'sidebar_box',
      'title',
      'content',
      'action'
    ],
    sections: {
      // Container sections (presentation-only)
      'right-sidebar-grid': {
        asContainer: true,
        blocks: []
      },
      'sidebar_box': {
        asContainer: true,
        style: {
          backgroundColor: '#f9fafb',
        },
        blocks: []
      },
      'sidebar-flex': {
        asContainer: true,
        blocks: []
      },
      'promo_box': {
        asContainer: true,
        blocks: []
      },
      'main-content-flex': {
        asContainer: true,
        blocks: []
      },
      'main-header': {
        asContainer: true,
        blocks: []
      },
      // Content sections (block-droppable)
      title: {
        appearance: {
          padding: '24px'
        },
        blocks: []
      },
      content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
        },
        blocks: []
      },
      action: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
      promo_header: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
      promo_content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
        },
        blocks: []
      },
      promo_action: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
    }
  },
  'promo': {
    id: 'promo',
    name: 'Promo Layout',
    description: 'Promotional layout with highlighted promo sections and call-to-action areas',
    icon: Megaphone,
    layoutIdentifier: 'promo@v1',
    layoutConfig: LAYOUT_CONFIGS['promo'],
    exposed: [
      'main_box',
      'title',
      'content',
      'action',
      'promo_box',
      'promo_header',
      'promo_content'
    ],
    sections: {
      // Container sections (presentation-only)
      '1x2-grid': {
        asContainer: true,
        blocks: []
      },
      'core-box': {
        asContainer: true,
        blocks: []
      },
      'main_box': {
        asContainer: true,
        style: {
          backgroundColor: '#FFFFFF'
        },
        blocks: []
      },
      'header': {
        asContainer: true,
        blocks: []
      },
      'promo_box': {
        asContainer: true,
        style: {
          backgroundColor: '#EFF6FF'
        },
        blocks: []
      },
      // Content sections (block-droppable)
      title: {
        appearance: {
          padding: '24px'
        },
        blocks: []
      },
      content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
        },
        blocks: []
      },
      action: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
      promo_header: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
      promo_content: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
    }
  },
  'hamburger-split': {
    id: 'hamburger-split',
    name: 'Hamburger Split Layout',
    description: 'Layout with header and footer and a 50/50 grid in the middle',
    icon: Menu,
    layoutIdentifier: 'hamburger-split@v1',
    layoutConfig: LAYOUT_CONFIGS['hamburger-split'],
    exposed: [
      'header',
      'main_box',
      'title',
      'content',
      'promo_content',
      'footer'
    ],
    sections: {
      // Container sections (presentation-only)
      'hamburger-container': {
        asContainer: true,
        blocks: []
      },
      'middle-grid': {
        asContainer: true,
        blocks: []
      },
      'main_box': {
        asContainer: true,
        blocks: []
      },
      'right-content': {
        asContainer: true,
        blocks: []
      },
      // Content sections (block-droppable)
      header: {
        appearance: {
          padding: '16px',
        },
        blocks: []
      },
      title: {
        appearance: {
          padding: '24px'
        },
        blocks: []
      },
      content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
        },
        blocks: []
      },
      promo_content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
        },
        blocks: []
      },
      footer: {
        appearance: {
          padding: '16px',
        },
        blocks: []
      },
    }
  },
  'full-width': {
    id: 'full-width',
    name: 'Full Width Layout',
    description: 'Clean full-width layout perfect for landing pages and content-focused designs',
    icon: LayoutGrid,
    layoutIdentifier: 'full-width@v1',
    layoutConfig: LAYOUT_CONFIGS['full-width'],
    exposed: [
      'main_box',
      'header',
      'content',
      'footer'
    ],
    sections: {
      // Container sections (presentation-only)
      'main_box': {
        asContainer: true,
        blocks: []
      },
      // Content sections (block-droppable)
      header: {
        appearance: {
          padding: '32px',
        },
        blocks: []
      },
      content: {
        appearance: {
          padding: '24px',
          spacing: '8px',
        },
        blocks: []
      },
      footer: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
    }
  },
  'stripe-checkout': {
    id: 'stripe-checkout',
    name: 'Stripe Checkout Layout',
    description: 'Stripe-style checkout with two centered columns, vertical divider, and full-bleed backgrounds',
    icon: Columns2Icon,
    layoutIdentifier: 'stripe-checkout@v1',
    layoutConfig: LAYOUT_CONFIGS['stripe-checkout'],
    exposed: [
      'stripe_left',
      'stripe_right',
      'stripe_left_inner',
      'stripe_left_header',
      'stripe_left_content',
      'stripe_left_action',
      'stripe_right_inner',
      'stripe_right_content'
    ],
    sections: {
      // Container sections
      'stripe-checkout-outer': {
        asContainer: true,
        blocks: []
      },
      'stripe-bg-row': {
        asContainer: true,
        blocks: []
      },
      'stripe_left': {
        asContainer: true,
        style: {
          backgroundColor: '#fafafa'
        },
        blocks: []
      },
      'stripe_right': {
        asContainer: true,
        style: {
          backgroundColor: '#ffffff'
        },
        blocks: []
      },
      'stripe-checkout-grid': {
        asContainer: true,
        style: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'stripe_left_inner': {
        asContainer: true,
        style: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'stripe_right_inner': {
        asContainer: true,
        blocks: []
      },
      // Content sections
      stripe_left_header: {
        appearance: {
          padding: '32px',
        },
        blocks: []
      },
      stripe_left_content: {
        appearance: {
          padding: '24px',
          spacing: '8px',
        },
        blocks: []
      },
      stripe_left_action: {
        appearance: {
          padding: '24px',
        },
        blocks: []
      },
      stripe_right_content: {
        appearance: {
          padding: '32px',
          spacing: '8px',
        },
        blocks: []
      }
    }
  }
};

const DEFAULT_LAYOUT = AVAILABLE_LAYOUTS['promo'];

export const getLayoutConfig = (layoutId: string): LayoutConfig | null => {
  return AVAILABLE_LAYOUTS[layoutId] || DEFAULT_LAYOUT;
};

export const getAllLayouts = (): LayoutConfig[] => {
  return Object.values(AVAILABLE_LAYOUTS);
};

export const getLayoutJSONConfig = (layoutId: string) => {
  return LAYOUT_CONFIGS[layoutId as keyof typeof LAYOUT_CONFIGS] || LAYOUT_CONFIGS['promo'];
};

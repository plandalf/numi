import { LayoutConfig } from '@/types/layout';
import { LayoutGrid, Megaphone, PanelLeft, PanelRight, Menu } from 'lucide-react';

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
            "className": "max-h-[inherit] h-full overflow-y-auto bg-transparent"
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
                      "type": "box",
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
            "className": "max-h-[inherit] hidden md:flex h-full overflow-y-auto flex-col"
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
  }
};

export const getLayoutConfig = (layoutId: string): LayoutConfig | null => {
  return AVAILABLE_LAYOUTS[layoutId] || null;
};

export const getAllLayouts = (): LayoutConfig[] => {
  return Object.values(AVAILABLE_LAYOUTS);
};

export const getLayoutJSONConfig = (layoutId: string) => {
  return LAYOUT_CONFIGS[layoutId as keyof typeof LAYOUT_CONFIGS] || LAYOUT_CONFIGS['promo'];
}; 
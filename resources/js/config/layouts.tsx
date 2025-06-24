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
        "className": "grid grid-cols-1 lg:grid-cols-[400px_1fr] h-full w-full"
      },
      "children": [
        {
          "type": "box",
          "id": "sidebar-box",
          "props": {
            "className": "h-full min-h-[inherit] overflow-y-auto bg-gray-50 border-r"
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
                    "className": "p-6"
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
                    "className": "p-6 mt-auto"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "box",
          "id": "main-content-box",
          "props": {
            "className": "h-full min-h-[inherit] overflow-y-auto"
          },
          "children": [
            {
              "type": "flex",
              "id": "main-content-flex",
              "props": {
                "className": "flex flex-col h-full"
              },
              "children": [
                {
                  "type": "flex",
                  "id": "main-header",
                  "props": {
                    "className": "flex flex-col flex-grow overflow-y-auto"
                  },
                  "children": [
                    {
                      "id": "promo_header",
                      "type": "box",
                      "props": {
                        "className": "space-y-1 p-6"
                      }
                    },
                    {
                      "id": "promo_content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow space-y-2 p-6"
                      }
                    }
                  ]
                },
                {
                  "id": "promo_action",
                  "type": "box",
                  "props": {
                    "className": "p-6"
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
        "className": "grid grid-cols-1 lg:grid-cols-[1fr_400px] h-full w-full"
      },
      "children": [
        {
          "type": "box",
          "id": "main-content-box",
          "props": {
            "className": "h-full min-h-[inherit] overflow-y-auto"
          },
          "children": [
            {
              "type": "flex",
              "id": "main-content-flex",
              "props": {
                "className": "flex flex-col h-full"
              },
              "children": [
                {
                  "type": "flex",
                  "id": "main-header",
                  "props": {
                    "className": "flex flex-col flex-grow overflow-y-auto"
                  },
                  "children": [
                    {
                      "id": "promo_header",
                      "type": "box",
                      "props": {
                        "className": "space-y-1 p-6"
                      }
                    },
                    {
                      "id": "promo_content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow space-y-2 p-6"
                      }
                    }
                  ]
                },
                {
                  "id": "promo_action",
                  "type": "box",
                  "props": {
                    "className": "p-6"
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "box",
          "id": "sidebar-box",
          "props": {
            "className": "h-full min-h-[inherit] overflow-y-auto bg-gray-50 border-l"
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
                    "className": "p-6"
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
                    "className": "p-6 mt-auto"
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
        "className": "grid grid-cols-1 md:grid-cols-2 h-full w-full"
      },
      "children": [
        {
          "type": "box",
          "id": "core-box",
          "props": {
            "className": "h-full min-h-[inherit] overflow-y-auto"
          },
          "children": [
            {
              "type": "flex",
              "id": "core-flex",
              "props": {
                "className": "flex flex-col h-full"
              },
              "children": [
                {
                  "type": "flex",
                  "id": "header",
                  "props": {
                    "className": "flex flex-col flex-grow overflow-y-auto"
                  },
                  "children": [
                    {
                      "id": "title",
                      "type": "box",
                      "props": {
                        "className": "space-y-1 p-6"
                      }
                    },
                    {
                      "id": "content",
                      "type": "flex",
                      "props": {
                        "className": "flex flex-col flex-grow space-y-2 p-6"
                      }
                    }
                  ]
                },
                {
                  "id": "action",
                  "type": "box",
                  "props": {
                    "className": "p-6"
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
            "className": "hidden md:flex h-full overflow-y-auto flex-col"
          },
          "children": [
            {
              "id": "promo_header",
              "type": "box",
              "props": {
                "className": "h-auto p-6"
              }
            },
            {
              "id": "promo_content",
              "type": "box",
              "props": {
                "className": "h-full flex flex-col flex-grow space-y-2 p-6 min-h-max"
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
        "className": "flex flex-col h-full w-full"
      },
      "children": [
        {
          "id": "header",
          "type": "box",
          "props": {
            "className": "w-full bg-white border-b p-4"
          }
        },
        {
          "type": "grid",
          "id": "middle-grid",
          "props": {
            "className": "grid grid-cols-1 md:grid-cols-2 flex-grow h-full"
          },
          "children": [
            {
              "type": "box",
              "id": "left-content",
              "props": {
                "className": "h-full overflow-y-auto border-r"
              },
              "children": [
                {
                  "id": "title",
                  "type": "box",
                  "props": {
                    "className": "p-6"
                  }
                },
                {
                  "id": "content",
                  "type": "flex",
                  "props": {
                    "className": "flex flex-col space-y-2 p-6"
                  }
                }
              ]
            },
            {
              "type": "box",
              "id": "right-content", 
              "props": {
                "className": "h-full overflow-y-auto"
              },
              "children": [
                {
                  "id": "promo_content",
                  "type": "flex",
                  "props": {
                    "className": "flex flex-col space-y-2 p-6"
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
            "className": "w-full bg-white border-t"
          },
          "children": [
            {
              "id": "action",
              "type": "box",
              "props": {
                "className": "p-4"
              }
            }
          ]
        }
      ]
    }
  },
  
  'full-width': {
    "name": "FullWidth@v1",
    "template": {
      "type": "flex",
      "id": "full-width-container",
      "props": {
        "className": "flex flex-col h-full w-full max-w-4xl mx-auto"
      },
      "children": [
        {
          "id": "header",
          "type": "box",
          "props": {
            "className": "w-full p-8"
          }
        },
        {
          "id": "content",
          "type": "flex",
          "props": {
            "className": "flex flex-col flex-grow space-y-4 px-8"
          }
        },
        {
          "id": "footer",
          "type": "box",
          "props": {
            "className": "w-full p-8 mt-auto"
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
    sections: {
      // Container sections (presentation-only)
      'left-sidebar-grid': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'sidebar-box': {
        asContainer: true,
        appearance: {
          backgroundColor: '#f9fafb',
          borderRight: '1px solid #e5e7eb'
        },
        blocks: []
      },
      'sidebar-flex': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'main-content-box': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'main-content-flex': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'  
        },
        blocks: []
      },
      'main-header': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
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
          flexGrow: '1'
        },
        blocks: []
      },
      action: {
        appearance: {
          padding: '24px',
          flexShrink: '0'
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
          flexGrow: '1'
        },
        blocks: []
      },
      promo_action: {
        appearance: {
          padding: '24px',
          flexShrink: '0'
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
    sections: {
      // Container sections (presentation-only)
      'right-sidebar-grid': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'sidebar-box': {
        asContainer: true,
        appearance: {
          backgroundColor: '#f9fafb',
          borderLeft: '1px solid #e5e7eb'
        },
        blocks: []
      },
      'sidebar-flex': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'main-content-box': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'main-content-flex': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'  
        },
        blocks: []
      },
      'main-header': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
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
          flexGrow: '1'
        },
        blocks: []
      },
      action: {
        appearance: {
          padding: '24px',
          flexShrink: '0'
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
          flexGrow: '1'
        },
        blocks: []
      },
      promo_action: {
        appearance: {
          padding: '24px',
          flexShrink: '0'
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
    sections: {
      // Container sections (presentation-only)
      '1x2-grid': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'core-box': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'core-flex': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'header': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'promo_box': {
        asContainer: true,
        appearance: {
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
          flexGrow: '1'
        },
        blocks: []
      },
      action: {
        appearance: {
          padding: '24px',
          flexShrink: '0'
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
    sections: {
      // Container sections (presentation-only)
      'hamburger-container': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'middle-grid': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
        blocks: []
      },
      'left-content': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent',
          borderRight: '1px solid #e5e7eb'
        },
        blocks: []
      },
      'right-content': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
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
          flexGrow: '1'
        },
        blocks: []
      },
      promo_content: {
        appearance: {
          padding: '24px',
          spacing: '4px',
          flexGrow: '1'
        },
        blocks: []
      },
      footer: {
        appearance: {
          padding: '16px',
        },
        blocks: []
      },
      action: {
        appearance: {
          padding: '16px',
          flexShrink: '0'
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
    sections: {
      // Container sections (presentation-only)
      'full-width-container': {
        asContainer: true,
        appearance: {
          backgroundColor: 'transparent'
        },
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
          flexGrow: '1'
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
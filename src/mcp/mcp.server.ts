import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// In-memory storage for standalone MCP server demo
// In production, this would connect to the actual database
interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const items: Map<string, Item> = new Map();

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create the MCP server
const server = new McpServer({
  name: 'nestjs-items-server',
  version: '1.0.0',
});

// Tool: List all items
server.tool('list_items', 'List all items in the inventory', {}, async () => {
  const allItems = Array.from(items.values());
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(allItems, null, 2),
      },
    ],
  };
});

// Tool: Get a single item by ID
server.tool(
  'get_item',
  'Get a specific item by its ID',
  {
    id: z.string().uuid().describe('The UUID of the item to retrieve'),
  },
  async ({ id }) => {
    const item = items.get(id);
    if (!item) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Item with ID "${id}" not found`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(item, null, 2),
        },
      ],
    };
  },
);

// Tool: Create a new item
server.tool(
  'create_item',
  'Create a new item in the inventory',
  {
    name: z.string().describe('The name of the item'),
    description: z.string().optional().describe('Optional description of the item'),
    price: z.number().min(0).optional().default(0).describe('Price of the item (must be >= 0)'),
    isActive: z.boolean().optional().default(true).describe('Whether the item is active'),
  },
  async ({ name, description, price, isActive }) => {
    const now = new Date();
    const newItem: Item = {
      id: generateUUID(),
      name,
      description,
      price: price ?? 0,
      isActive: isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    items.set(newItem.id, newItem);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(newItem, null, 2),
        },
      ],
    };
  },
);

// Tool: Update an existing item
server.tool(
  'update_item',
  'Update an existing item in the inventory',
  {
    id: z.string().uuid().describe('The UUID of the item to update'),
    name: z.string().optional().describe('New name for the item'),
    description: z.string().optional().describe('New description for the item'),
    price: z.number().min(0).optional().describe('New price for the item'),
    isActive: z.boolean().optional().describe('Whether the item is active'),
  },
  async ({ id, name, description, price, isActive }) => {
    const item = items.get(id);
    if (!item) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Item with ID "${id}" not found`,
          },
        ],
        isError: true,
      };
    }

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (isActive !== undefined) item.isActive = isActive;
    item.updatedAt = new Date();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(item, null, 2),
        },
      ],
    };
  },
);

// Tool: Delete an item
server.tool(
  'delete_item',
  'Delete an item from the inventory',
  {
    id: z.string().uuid().describe('The UUID of the item to delete'),
  },
  async ({ id }) => {
    const item = items.get(id);
    if (!item) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Item with ID "${id}" not found`,
          },
        ],
        isError: true,
      };
    }
    items.delete(id);
    return {
      content: [
        {
          type: 'text',
          text: `Item "${item.name}" (${id}) has been deleted`,
        },
      ],
    };
  },
);

// Resource: Expose items as a resource
server.resource('items://list', 'items://list', async () => {
  const allItems = Array.from(items.values());
  return {
    contents: [
      {
        uri: 'items://list',
        mimeType: 'application/json',
        text: JSON.stringify(allItems, null, 2),
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NestJS Items MCP Server running on stdio');
}

main().catch(console.error);

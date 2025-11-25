import { Injectable, OnModuleInit } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ItemsService } from '../items/items.service';

@Injectable()
export class McpService implements OnModuleInit {
  private server: McpServer;

  constructor(private readonly itemsService: ItemsService) {}

  onModuleInit() {
    this.server = new McpServer({
      name: 'nestjs-items-server',
      version: '1.0.0',
    });

    this.registerTools();
    this.registerResources();
  }

  getServer(): McpServer {
    return this.server;
  }

  private registerTools() {
    // Tool: List all items
    this.server.tool('list_items', 'List all items in the inventory', {}, async () => {
      const items = await this.itemsService.findAll();
      return {
        content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
      };
    });

    // Tool: Get a single item by ID
    this.server.tool(
      'get_item',
      'Get a specific item by its ID',
      {
        id: z.string().uuid().describe('The UUID of the item to retrieve'),
      },
      async ({ id }) => {
        try {
          const item = await this.itemsService.findOne(id);
          return {
            content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
          };
        } catch {
          return {
            content: [{ type: 'text', text: `Error: Item with ID "${id}" not found` }],
            isError: true,
          };
        }
      },
    );

    // Tool: Create a new item
    this.server.tool(
      'create_item',
      'Create a new item in the inventory',
      {
        name: z.string().describe('The name of the item'),
        description: z.string().optional().describe('Optional description of the item'),
        price: z.number().min(0).optional().default(0).describe('Price of the item (must be >= 0)'),
        isActive: z.boolean().optional().default(true).describe('Whether the item is active'),
      },
      async ({ name, description, price, isActive }) => {
        const item = await this.itemsService.create({
          name,
          description,
          price,
          isActive,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      },
    );

    // Tool: Update an existing item
    this.server.tool(
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
        try {
          const item = await this.itemsService.update(id, {
            name,
            description,
            price,
            isActive,
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
          };
        } catch {
          return {
            content: [{ type: 'text', text: `Error: Item with ID "${id}" not found` }],
            isError: true,
          };
        }
      },
    );

    // Tool: Delete an item
    this.server.tool(
      'delete_item',
      'Delete an item from the inventory',
      {
        id: z.string().uuid().describe('The UUID of the item to delete'),
      },
      async ({ id }) => {
        try {
          await this.itemsService.remove(id);
          return {
            content: [{ type: 'text', text: `Item ${id} has been deleted` }],
          };
        } catch {
          return {
            content: [{ type: 'text', text: `Error: Item with ID "${id}" not found` }],
            isError: true,
          };
        }
      },
    );
  }

  private registerResources() {
    this.server.resource('items://list', 'items://list', async () => {
      const items = await this.itemsService.findAll();
      return {
        contents: [
          {
            uri: 'items://list',
            mimeType: 'application/json',
            text: JSON.stringify(items, null, 2),
          },
        ],
      };
    });
  }
}

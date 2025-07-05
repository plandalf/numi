# Fulfillment API Documentation

## Overview

The Fulfillment API provides endpoints for managing order fulfillment status, tracking information, and delivery assets. The API is designed to match the UI requirements exactly, ensuring consistency between frontend and backend.

## Authentication

All API endpoints require API key authentication. Include your API key in the request headers:

```
Authorization: Bearer YOUR_API_KEY
```

## Base URL

```
https://your-domain.com/api/v1/fulfillment
```

## Endpoints

### 1. Update Order Item Fulfillment

**Endpoint:** `POST /order-items/{orderItem}/update`

**Description:** Comprehensive fulfillment update that matches the UI form requirements.

**Parameters:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `fulfillment_status` | string | Yes | `in:pending,partially_fulfilled,fulfilled,unprovisionable` | Current fulfillment status |
| `quantity_fulfilled` | integer | Yes | `min:0,max:order_item_quantity` | Number of items fulfilled |
| `notes` | string | No | `max:1000` | Fulfillment notes |
| `metadata` | object | No | - | Custom metadata key-value pairs |
| `tracking_number` | string | No | `max:255` | Shipping tracking number |
| `tracking_url` | string | No | `url\|max:500` | Tracking URL |
| `unprovisionable_reason` | string | No | `max:1000` | Reason if status is unprovisionable |
| `delivery_assets` | array | No | - | Array of delivery assets |
| `delivery_assets.*.name` | string | Yes* | `max:255` | Asset name (required if delivery_assets provided) |
| `delivery_assets.*.url` | string | Yes* | `url\|max:500` | Asset URL (required if delivery_assets provided) |

**Example Request:**

```json
{
  "fulfillment_status": "partially_fulfilled",
  "quantity_fulfilled": 2,
  "notes": "Shipped via express delivery",
  "metadata": {
    "carrier": "FedEx",
    "service_level": "express"
  },
  "tracking_number": "1234567890",
  "tracking_url": "https://fedex.com/track?trknbr=1234567890",
  "delivery_assets": [
    {
      "name": "Digital Download",
      "url": "https://example.com/download/file.pdf"
    }
  ]
}
```

**Example Response:**

```json
{
  "data": {
    "id": 123,
    "fulfillment_status": "partially_fulfilled",
    "quantity_fulfilled": 2,
    "quantity_remaining": 1,
    "notes": "Shipped via express delivery",
    "tracking_number": "1234567890",
    "tracking_url": "https://fedex.com/track?trknbr=1234567890",
    "delivery_assets": [
      {
        "name": "Digital Download",
        "url": "https://example.com/download/file.pdf"
      }
    ]
  },
  "message": "Order item fulfillment updated successfully"
}
```

### 2. Mark Order Item as Unprovisionable

**Endpoint:** `POST /order-items/{orderItem}/mark-unprovisionable`

**Description:** Mark an order item as unprovisionable with a reason.

**Parameters:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `unprovisionable_reason` | string | Yes | `max:1000` | Reason why item cannot be fulfilled |
| `notes` | string | No | `max:1000` | Additional notes |

**Example Request:**

```json
{
  "unprovisionable_reason": "Product discontinued by manufacturer",
  "notes": "Customer will be contacted for alternative options"
}
```

### 3. Update Tracking Information

**Endpoint:** `PATCH /order-items/{orderItem}/tracking`

**Description:** Update tracking information for an order item.

**Parameters:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `tracking_number` | string | No | `max:255` | Shipping tracking number |
| `tracking_url` | string | No | `url\|max:500` | Tracking URL |
| `expected_delivery_date` | date | No | `date` | Expected delivery date |
| `delivered_at` | date | No | `date` | Actual delivery date |
| `notes` | string | No | `max:1000` | Additional notes |

### 4. Get Fulfillment Overview

**Endpoint:** `GET /`

**Description:** Get fulfillment overview for the organization.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by fulfillment status |
| `fulfillment_method` | string | Filter by fulfillment method |
| `page` | integer | Page number for pagination |

**Example Response:**

```json
{
  "data": [
    {
      "id": 123,
      "uuid": "order-uuid",
      "fulfillment_summary": {
        "total_items": 3,
        "fulfilled_items": 2,
        "pending_items": 1,
        "unprovisionable_items": 0
      }
    }
  ],
  "meta": {
    "total": 50,
    "per_page": 20,
    "current_page": 1,
    "last_page": 3
  }
}
```

### 5. Get Fulfillment Statistics

**Endpoint:** `GET /statistics`

**Description:** Get fulfillment statistics for the organization.

**Example Response:**

```json
{
  "data": {
    "total_orders": 150,
    "pending_fulfillment": 25,
    "fulfilled_items": 300,
    "unprovisionable_items": 5
  }
}
```

### 6. Get Order Fulfillment Details

**Endpoint:** `GET /orders/{order}`

**Description:** Get detailed fulfillment information for a specific order.

**Example Response:**

```json
{
  "data": {
    "id": 123,
    "uuid": "order-uuid",
    "fulfillment_summary": {
      "total_items": 3,
      "fulfilled_items": 2,
      "pending_items": 1,
      "unprovisionable_items": 0
    },
    "items": [
      {
        "id": 456,
        "fulfillment_status": "fulfilled",
        "quantity_fulfilled": 2,
        "tracking_number": "1234567890",
        "delivery_assets": []
      }
    ]
  }
}
```

### 7. Resend Order Notification

**Endpoint:** `POST /orders/{order}/resend-notification`

**Description:** Resend fulfillment notification email for an order.

**Example Response:**

```json
{
  "message": "Order notification sent successfully"
}
```

## Legacy Endpoints

For backward compatibility, the following legacy endpoints are still available:

- `POST /order-items/{orderItem}/provision` - Legacy provisioning endpoint
- `POST /order-items/{orderItem}/mark-unprovisionable` - Legacy unprovisionable endpoint

## Error Responses

**Validation Error (422):**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "fulfillment_status": ["The fulfillment status field is required."],
    "quantity_fulfilled": ["The quantity fulfilled must be at least 0."]
  }
}
```

**Authorization Error (403):**

```json
{
  "error": "Unauthorized",
  "message": "You are not authorized to perform this action."
}
```

**Server Error (500):**

```json
{
  "error": "Failed to update order item fulfillment",
  "message": "An error occurred while processing the request."
}
```

## Field Mapping

The API field names exactly match the UI form fields:

| UI Field | API Field | Type | Required |
|----------|-----------|------|----------|
| Fulfillment Status | `fulfillment_status` | string | Yes |
| Quantity Fulfilled | `quantity_fulfilled` | integer | Yes |
| Notes | `notes` | string | No |
| Custom Metadata | `metadata` | object | No |
| Tracking Number | `tracking_number` | string | No |
| Tracking URL | `tracking_url` | string | No |
| Unprovisionable Reason | `unprovisionable_reason` | string | No |
| Delivery Assets | `delivery_assets` | array | No |

## Status Values

- `pending` - Item is waiting to be fulfilled
- `partially_fulfilled` - Some items have been fulfilled
- `fulfilled` - All items have been fulfilled
- `unprovisionable` - Item cannot be fulfilled

## Notes

- All timestamps are returned in ISO 8601 format
- URLs must be valid HTTP/HTTPS URLs
- Metadata can contain any key-value pairs as needed
- Delivery assets are stored as an array of objects with `name` and `url` fields
- The API automatically handles fulfillment timestamps and user tracking
- Order fulfillment status is automatically updated when individual items are updated 
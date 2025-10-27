// src/data/couponSurvey.js
export const couponSurveyJson = {
  title: "Create a Coupon",
  showProgressBar: "top",
  pages: [
    {
      name: "metadata",
      elements: [
        {
          type: "hidden",
          name: "group_id",
          defaultValue: "22222222-2222-2222-2222-222222222222"
        },
        {
          type: "dropdown",
          name: "group_id",
          title: "Select Foodie Group",
          isRequired: true,
          choices: [],
          searchEnabled: true
        },
        // ↓ Replace the hidden merchant_id with a dropdown ↓
        {
          type: "dropdown",
          name: "merchant_id",            // must match your pgTable column
          title: "Select Merchant",
          isRequired: true,
          /* OPTION A: Preload choices in JS and pass merchantChoices
          choices: merchantChoices,       // e.g. [{ value: "uuid1", text: "Merchant A" }, ...]
          searchEnabled: true             // enables built-in search/filter*/  
          
          //  OPTION B: Fetch live via REST  
          choicesByUrl: {
            url: "/api/v1/merchants",         // your endpoint
            path: "",                  // JSON path to array
            valueName: "id",               // field for the value
            titleName: "name"              // field for the display text
          },
          searchEnabled: true  
        },
        {
          type: "text",
          name: "title",
          title: "Coupon Title",
          isRequired: true
        },
        {
          type: "comment",
          name: "description",
          title: "Description",
          isRequired: true
        }
      ]
      },
      {
        name: "settings",
        elements: [
          {
            type: "dropdown",
            name: "coupon_type",
            title: "Coupon Type",
            isRequired: true,
            choices: [
              { value: "percent",    text: "Percent Off"    },
              { value: "amount",     text: "Amount Off"     },
              { value: "bogo",       text: "Buy One, Get One" },
              { value: "free_item",  text: "Free Item"      }
            ]
          },
          {
            type: "text",
            name: "discountValue",
            title: "Discount Value",
            inputType: "number",
            validators: [{ type: "numeric", minValue: 0 }]
          },
          {
            type: "text",
            name: "valid_from",
            title: "Valid From",
            inputType: "date",
            defaultValueExpression: "today()",
            isRequired: true
          },
          {
            type: "text",
            name: "expires_at",
            title: "Expires At",
            inputType: "date",
            defaultValueExpression: "addDays(today(), 7)",
            isRequired: true
          },
          /*{
            type: "boolean",
            name: "locked",
            title: "Require unlock to redeem?",
            defaultValue: true
          },**/
          {
            type: "text",
            name: "cuisine_type",
            title: "Cuisine Type",
            description: "e.g. Italian, Mexican, etc.",
            isRequired: false
          }          
        ]
      },
      /*{
        name: "qr",
        elements: [
          {
            type: "text",
            name: "qr_code_url",
            title: "QR Code Image URL",
            description: "Enter a link to the QR code (or leave blank to auto-generate)."
          }
        ]
      }*/
    ]
  };
  
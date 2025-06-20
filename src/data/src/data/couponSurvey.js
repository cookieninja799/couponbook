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
            type: "hidden",
            name: "merchant_id",
            defaultValue: "11111111-1111-1111-1111-111111111111"
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
            name: "couponType",
            title: "Coupon Type",
            choices: [
              { value: "percentage", text: "Percentage" },
              { value: "free",       text: "Free Item" },
              { value: "bogo",       text: "Buy One, Get One" }
            ],
            isRequired: true
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
          {
            type: "boolean",
            name: "locked",
            title: "Require unlock to redeem?",
            defaultValue: true
          }
        ]
      },
      {
        name: "qr",
        elements: [
          {
            type: "text",
            name: "qr_code_url",
            title: "QR Code Image URL",
            description: "Enter a link to the QR code (or leave blank to auto-generate)."
          }
        ]
      }
    ]
  };
  
<!-- src/views/CouponSubmissions.vue -->
<template>
  <div class="submissions">
    <h1>Submit a New Coupon</h1>
    <survey-component :model="survey" />
  </div>
</template>

<script setup>
import { ref, onMounted }   from 'vue'
import { useRouter }        from 'vue-router'
import { Model }            from 'survey-core'
import { SurveyComponent }  from 'survey-vue3-ui'
import { couponSurveyJson } from '@/data/couponSurvey.js'

const API_BASE    = '/api/v1'
const WEBHOOK_URL = 'https://n8n.vivaspot.com/webhook/7d15576d-01a3-49c8-b0f4-6c490e54baa7'
const TEST_EMAIL  = 'thommy@ivalu8.com'

const router = useRouter()
const survey = ref(new Model(couponSurveyJson))

// Helper to load choices for a question
async function loadChoices(questionName, endpoint) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`)
    if (!res.ok) throw new Error(res.statusText)
    const items = await res.json()
    const q = survey.value.getQuestionByName(questionName)
    if (q) {
      q.choices = items.map(i => ({ value: i.id, text: i.name }))
    }
    return items
  } catch (err) {
    console.error(`Failed to load ${endpoint}:`, err)
    alert(`⚠️ Could not load ${endpoint}`)
    return []
  }
}

onMounted(async () => {
  // Fetch groups & merchants in parallel
  await Promise.all([
    loadChoices('group_id',    'groups'),
    loadChoices('merchant_id', 'merchants'),
  ])

  // Register the completion handler
  survey.value.onComplete.add(handleSubmit)
})

async function handleSubmit(sender) {
  const d = sender.data

  // Build submission_data payload
  const submissionData = {
    title:          d.title,
    description:    d.description,
    coupon_type:    d.coupon_type,
    discount_value: parseFloat(d.discount_value) || 0,
    valid_from:     d.valid_from,
    expires_at:     d.expires_at,
    qr_code_url:    d.qr_code_url,
    locked:         d.locked
  }

  try {
    // 1) Insert into coupon_submissions
    const res = await fetch(`${API_BASE}/coupon-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id:       d.group_id,
        merchant_id:    d.merchant_id,
        submission_data: submissionData
      })
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    console.log('🗂 Saved submission:', await res.json())

    // 2) Fire off the n8n webhook for email notification
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail:       TEST_EMAIL,
        groupId:         d.group_id,
        merchantId:      d.merchant_id,
        submission_data: submissionData
      })
    })

    alert('✅ Coupon sent for approval! You’ll see it live once your Foodie Group accepts it.')
    router.push({ name: 'CouponBook' })
  } catch (err) {
    console.error('❌ Submission error:', err)
    alert(`⚠️ Coupon creation failed: ${err.message}`)
  }
}
</script>

<style scoped>
.submissions {
  max-width: 700px;
  margin: 2rem auto;
}
</style>

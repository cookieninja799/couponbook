<!-- src/views/CouponSubmissions.vue -->
<template>
  <div class="submissions">
    <h1>Submit a New Coupon</h1>
    <survey-component :model="survey" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import { Model }          from 'survey-core'
import { SurveyComponent } from 'survey-vue3-ui'
import { couponSurveyJson } from '@/data/couponSurvey.js'  // adjust path as needed

const router = useRouter()
const survey = ref(new Model(couponSurveyJson))

onMounted(async () => {
   try {
    const respG = await fetch('http://localhost:3000/api/v1/groups')
    if (!respG.ok) throw new Error('Failed to load groups')
    const groups = await respG.json()
    const qg = survey.value.getQuestionByName('group_id')
    if (qg) {
      qg.choices = groups.map(g => ({ value: g.id, text: g.name }))
    }
  } catch (err) {
    console.error(err)
    alert('⚠️ Could not load group list')
  }
  // 1) Load merchants
  try {
    const resp = await fetch('http://localhost:3000/api/v1/merchants')
    if (!resp.ok) throw new Error('Failed to load merchants')
    const merchants = await resp.json()
    const q = survey.value.getQuestionByName('merchant_id')
    if (q) {
      q.choices = merchants.map(m => ({ value: m.id, text: m.name }))
    }
  } catch (err) {
    console.error(err)
    alert('⚠️ Could not load merchant list')
  }

  // 2) Handle form completion
  survey.value.onComplete.add(async sender => {
  const d = sender.data;
  console.log('🖨️ Form data:', d);
  try {
    const res = await fetch('http://localhost:3000/api/v1/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id:       d.group_id,
        merchant_id:    d.merchant_id,
        title:          d.title,
        description:    d.description,
        coupon_type:    d.coupon_type,       // make sure this matches your question name
        discount_value: parseFloat(d.discount_value) || 0,
        valid_from:     d.valid_from,
        expires_at:     d.expires_at,
        qr_code_url:    d.qr_code_url,
        locked:         d.locked
      })
    });
    const text = await res.text();
    console.log('⬅️  Response:', res.status, text);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    alert('✅ Coupon submitted successfully!');
    router.push({ name: 'CouponBook' });
  } catch (err) {
    console.error('❌ Submission error:', err);
    alert(`⚠️ Coupon creation failed: ${err.message}`);
  }
  });
})
</script>

<style scoped>
.submissions {
  max-width: 700px;
  margin: 2rem auto;
}
</style>

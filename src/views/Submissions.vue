<template>
    <div class="submissions">
      <h1>Submit a New Coupon</h1>
      <survey-component :model="survey" />
    </div>
  </template>
  
  <script>
  import { couponSurveyJson } from '@/data/couponSurvey'
  import { ref, onMounted } from 'vue'
  import { useRouter }      from 'vue-router'
  import { Model }          from 'survey-core'
  import { SurveyComponent } from 'survey-vue3-ui'
  
  export default {
    name: 'CouponSubmissionForm',   // ← explicit multi-word component name
  
    components: { SurveyComponent },
  
    setup() {
      const router = useRouter()
      const survey = ref(new Model(couponSurveyJson))

      onMounted(() => {
        survey.value.onComplete.add(async sender => {
          const data = sender.data
          try {
            let res = await fetch('/api/v1/coupon_submissions', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({
                group_id:        data.group_id,
                merchant_id:     data.merchant_id,
                state:           'pending',
                submission_data: data
              })
            })
            if (!res.ok) throw new Error('Submission failed')
  
            res = await fetch('/api/v1/coupons', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({
                group_id:       data.group_id,
                merchant_id:    data.merchant_id,
                title:          data.title,
                description:    data.description,
                coupon_type:    data.couponType,
                discount_value: parseFloat(data.discountValue) || 0,
                valid_from:     data.valid_from,
                expires_at:     data.expires_at,
                qr_code_url:    data.qr_code_url,
                locked:         data.locked
              })
            })
            if (!res.ok) throw new Error('Coupon creation failed')
  
            alert('✅ Coupon submitted successfully!')
            router.push({ name: 'BrowseCoupons' })
          } catch (err) {
            console.error(err)
            alert(`⚠️ ${err.message}`)
          }
        })
      })
  
      return { survey }
    }
  }
  </script>
  
  <style scoped>
  .submissions {
    max-width: 700px;
    margin: 2rem auto;
  }
  </style>
  
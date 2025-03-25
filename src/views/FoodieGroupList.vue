<template>
  <div class="foodie-group-list">
    <h1>Available Foodie Groups</h1>
    <div class="group-list-container">
      <div 
        v-for="group in foodieGroups" 
        :key="group.id" 
        class="group-card">
        <div class="card-content">
          <h2>{{ group.name }}</h2>
          <p>{{ group.description }}</p>
          <p class="location">Location: {{ group.location }}</p>
        </div>
        <router-link :to="`/foodie-group/${group.id}`" class="btn">
          View Group
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import foodieGroups from '@/data/foodieGroups';

export default {
  name: "FoodieGroupList",
  data() {
    return {
      foodieGroups
    }
  }
}
</script>

<style scoped>
.foodie-group-list {
  padding: 2rem;
  text-align: center;
}

.group-list-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.group-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  width: 300px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* Optional: Set a min-height to ensure consistency */
  min-height: 350px;
}

.card-content {
  /* Ensures a gap between content and button */
  margin-bottom: 1rem;
}

.group-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.group-card p {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.location {
  font-style: italic;
  color: #555;
  margin-bottom: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #0056b3;
}
</style>

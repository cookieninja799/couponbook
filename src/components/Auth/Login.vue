<template>
  <div class="login">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" type="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input id="password" type="password" v-model="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "LoginForm",
  data() {
    return {
      email: "",
      password: ""
    };
  },
  methods: {
    handleLogin() {
      // This is a placeholder for AWS Cognito authentication
      console.log("Logging in with:", this.email, this.password);
      alert("Login functionality not implemented yet.");
    }
  }
};
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: var(--spacing-2xl) auto;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-sm);
}
.form-group {
  margin-bottom: var(--spacing-lg);
}
label {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
input {
  width: 100%;
  padding: var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  box-shadow: var(--shadow-xs);
  transition: box-shadow var(--transition-fast);
}
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(56, 66, 76, 0.1), var(--shadow-xs);
}
button {
  background-color: var(--color-secondary);
  color: var(--color-text-on-secondary);
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  cursor: pointer;
  min-height: var(--button-height-md);
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-base);
}
button:hover {
  background-color: var(--color-secondary-hover);
}
</style>

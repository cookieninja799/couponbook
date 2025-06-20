// src/plugins/surveyjs.js
import { surveyPlugin } from 'survey-vue3-ui';
import 'survey-core/survey-core.css';     // load default theme

export default {
  install(app) {
    app.use(surveyPlugin);
  }
}

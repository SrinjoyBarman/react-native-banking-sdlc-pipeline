## Run: {{RUN_ID}} — {{FEATURE_NAME}}

**Date**: {{DATE}}  
**Status**: {{STATUS}}  
**Duration**: {{DURATION}}

### Key Learnings

{{#EACH_LEARNING}}
{{INDEX}}. {{LEARNING_DESCRIPTION}}
{{/EACH_LEARNING}}

### Changes Applied to .github/

{{#EACH_CHANGE}}

- `{{FILE_PATH}}`: {{CHANGE_DESCRIPTION}}
  {{/EACH_CHANGE}}

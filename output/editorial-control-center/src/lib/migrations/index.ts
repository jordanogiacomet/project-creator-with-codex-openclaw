import * as migration_20260319_231737_initial_setup from './20260319_231737_initial_setup';
import * as migration_20260320_011731_st_008_roles_rbac from './20260320_011731_st_008_roles_rbac';
import * as migration_20260320_013217_st_001_cms_content_model from './20260320_013217_st_001_cms_content_model';
import * as migration_20260320_020224_st_010_draft_publish from './20260320_020224_st_010_draft_publish';

export const migrations = [
  {
    up: migration_20260319_231737_initial_setup.up,
    down: migration_20260319_231737_initial_setup.down,
    name: '20260319_231737_initial_setup',
  },
  {
    up: migration_20260320_011731_st_008_roles_rbac.up,
    down: migration_20260320_011731_st_008_roles_rbac.down,
    name: '20260320_011731_st_008_roles_rbac',
  },
  {
    up: migration_20260320_013217_st_001_cms_content_model.up,
    down: migration_20260320_013217_st_001_cms_content_model.down,
    name: '20260320_013217_st_001_cms_content_model',
  },
  {
    up: migration_20260320_020224_st_010_draft_publish.up,
    down: migration_20260320_020224_st_010_draft_publish.down,
    name: '20260320_020224_st_010_draft_publish'
  },
];

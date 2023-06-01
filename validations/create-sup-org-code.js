import { isNil, isNotNil } from './common/helpers'

export const supervisoryOrgValidations = (record) => {
  const manager_id = record.get('manager_id')
  const code = record.get('code')

  // Set Sup Org Code
  if (isNotNil(manager_id) && isNil(code)) {
    record.set('code', 'Sup_Org_${manager_id}')
    const message = 'Sup Org Code has been automatically generated'
    record.addInfo('code', message)
  }

  // Set Sup Org Manager Position ID
  if (isNotNil(manager_id) && isNil(code)) {
    record.set('code', 'P-${manager_id}')
    const message =
      'Sup Org Manager Position ID has been automatically generated'
    record.addInfo('code', message)
  }
}

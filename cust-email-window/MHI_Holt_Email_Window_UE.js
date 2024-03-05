/* eslint-disable max-len */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
  'N/record',
  'N/runtime',
  'N/search',
  'N/currentRecord',
  'N/url'
], (
  record,
  runtime,
  search,
  currentRecord,
  url
) => {
  function beforeLoad(context) {
    const { newRecord } = context;
    const params = context.request.parameters;
    const header = context.request.headers;
    log.debug('beforeLoad:: header', header);

    const { entity, transaction } = params;
    const recID = transaction;
    const customerID = entity;
    const ref = header.referer; // urlstring
    let recType = '';
    if (ref.includes('salesord')) {
      recType = 'salesorder';
    } else if (ref.includes('inv')) {
      recType = 'invoice';
    } else if (ref.includes('cred')) {
      recType = 'creditmemo';
    } else if (ref.includes('est')) {
      recType = 'estimate';
    } else if (ref.includes('auth')) {
      recType = 'returnauthorization';
    } else if (ref.includes('itemship')) {
      recType = 'itemfulfillment';
    } else { recType = 'purchaseorder'; }

    log.debug('beforeLoad:: entity', entity);
    log.debug('beforeLoad:: recType', recType);

    if (recType == '' || entity == null) { return; }

    const emails = findEmails(customerID, recType);
    log.debug('beforeLoad:: emails', emails);

    if (emails.length == 0) { return; }

    newRecord.setValue({
      fieldId: 'recipient',
      value: -1
    });
    newRecord.setValue({
      fieldId: 'recipientemail',
      value: emails[0]
    });
    emails.shift();
    if (emails.length == 0) { return; }

    for (let i = 0; i < emails.length; i += 1) {
      newRecord.setSublistValue({
        sublistId: 'otherrecipientslist',
        fieldId: 'email',
        line: i,
        value: emails[i]
      });
      newRecord.setSublistValue({
        sublistId: 'otherrecipientslist',
        fieldId: 'toRecipients',
        line: i,
        value: true
      });
    }
  }

  function findEmails(customerID, recType) {
    let emails = [];

    if (recType == 'purchaseorder') {
      const vendorSearch = search.create({
        type: 'vendor',
        filters:
        [
          ['internalid', 'anyof', customerID]
        ],
        columns:
        [
          'custentitycustentity_custentity_purchase'
        ]
      });
      vendorSearch.run().each((result) => {
        // .run().each has a limit of 4,000 results
        emails = (result.getValue({
          name: 'custentitycustentity_custentity_purchase'
        })).split(';');

        return true;
      });
    } else {
      const customerSearchObj = search.create({
        type: 'customer',
        filters:
      [
        ['internalid', 'anyof', customerID]
      ],
        columns:
      [

        'custentitycustentitycustentity_ah_invcmr',
        'custentitycustentitycustentity_ah_order_'
      ]
      });
      customerSearchObj.run().each((result) => {
      // .run().each has a limit of 4,000 results
        if (recType == 'salesorder' || recType == 'itemfulfillment') {
          emails = (result.getValue({
            name: 'custentitycustentitycustentity_ah_order_'
          })).split(';');
        }

        if (recType == 'estimate') {
          emails = (result.getValue({
            name: 'custentitycustentitycustentity_ah_order_'
          })).split(';');
        }

        if ((recType == 'creditmemo') || recType == 'returnauthorization') {
          emails = (result.getValue({
            name: 'custentitycustentitycustentity_ah_invcmr'
          })).split(';');
        }

        return true;
      });
    }

    // emails = ['daniellepark116@gmail.com'];
    return emails;
  }

  return {
    beforeLoad
  };
});

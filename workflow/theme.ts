const theme = {
  root: {
    primaryColor: '#005CB9',
    dangerColor: '#F44336',
    warningColor: '#FF9800',
  },
  sidebar: {
    logo: 'https://www.workday.com/content/dam/web/en-us/images/icons/general/workday-logo.svg',
    textColor: '#fff',
    titleColor: '#fff',
    focusBgColor: '#E5832D',
    focusTextColor: '#fff',
    backgroundColor: '#005CB9',
    footerTextColor: '#fff',
    textUltralightColor: '#F6C84F',
  },
  table: {
    inputs: {
      radio: {
        color: '#005CB9',
      },
      checkbox: {
        color: '#005CB9',
      },
    },
    filters: {
      color: '#000',
      active: {
        color: '#fff',
        backgroundColor: '#005CB9',
      },
      error: {
        activeBackgroundColor: '#F44336',
      },
    },
    column: {
      header: {
        fontSize: '14px',
        backgroundColor: '#F0F1F2',
        color: '#000',
        dragHandle: {
          idle: '#005CB9',
          dragging: '#005CB9',
        },
      },
    },
    fontFamily: "'Proxima Nova', 'Helvetica', sans-serif",
    indexColumn: {
      backgroundColor: '#F0F1F2',
      selected: {
        color: '#000',
        backgroundColor: '#F0F1F2',
      },
    },
    cell: {
      selected: {
        backgroundColor: '#F9DB75',
      },
      active: {
        borderColor: '#E5832D',
        spinnerColor: '#E5832D',
      },
    },
    boolean: {
      toggleChecked: '#005CB9',
    },
    loading: {
      color: '#005CB9',
    },
  },
}

export default theme

function create_ui_header(txt) {
    return '<tr><td colspan="2" class="header">' + txt + '</td></tr>';
}

function create_ui_space() {
    return '<tr><td colspan="2"></td></tr>';
}

function create_ui_range(id, txt, min, max, val) {
    return '<tr>' +
        '<td>' + txt + ':</td>' +
        '<td><input id="' + id + '" type="range" min="' + min + '" max="' + max + '" value="' + val + '" width="100px" /></td>' +
        '</tr>';
}

function create_ui_checkbox(id, txt, val) {
    return '<tr>' +
        '<td>' + txt + ':</td>' +
        '<td><input id="' + id + '" type="checkbox" ' + (val?'checked':'') + ' /></td>' +
        '</tr>';
}

function create_ui_dropdown(id, txt, vals, selected) {
    var html = '<tr>';
    html += '<td>' + txt + ':</td>';
    html += '<td><select id="' + id + '"">';
    for(var i = 0; i < vals.length; i++) {
        html += '<option value="' + vals[i] + '" ' + (vals[i]==selected?'selected':'') + '>' + vals[i] + '</option>';
    }
    html += '</select></td>';
    html += '</tr>';
    return html;
}

<% if(parsedSource.exportComponents.length) {%>import renderer from 'react-test-renderer';
<% } %><% allImports.forEach(function(value) { %><%=value.importText %>
<% }) %>import <%if(defaultExport)
{ %><%=defaultExport.name %><% }%><%=(defaultExport && namedExportsList.length ? ', ' : '') %><%if(namedExportsList.length) {%>{ <%=namedExportsList %> }<%} %> from <%=quoteSymbol %><%=path %><%=quoteSymbol %>;

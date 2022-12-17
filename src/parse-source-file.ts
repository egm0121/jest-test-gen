import * as ts from 'typescript';
import { ParsedSourceFile, ParsedClass, ParsedPojo, ParsedReactComponent, ParsedReactProp, ParsedPropTypePojo } from './model';
import debugFactory from 'debug';

const debug = debugFactory('jest-test-gen/parse-source-file');
const isNodeJSX = (node: ts.Node) => [
  ts.SyntaxKind.JsxElement, 
  ts.SyntaxKind.JsxFragment, 
  ts.SyntaxKind.JsxExpression, 
  ts.SyntaxKind.JsxSelfClosingElement
].includes(node.kind);

export function parseSourceFile(file: ts.SourceFile): ParsedSourceFile {
  const result: ParsedSourceFile = {
    imports: [],
    exportFunctions: [],
    exportPojos: [],
    exportClass: undefined,
    exportComponents: [],
    components: [],
    classes: [],
    functions: [],
    pojos: [],
    typeDefinitions: [],
    interfaceDefinitions: [],
    propTypesPojo: [],
  };
  walker(file);
  return result;

  function walker(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        debug('walker found import declaration');
        importsWalker(node as ts.ImportDeclaration);
        break;
      case ts.SyntaxKind.ClassDeclaration:
        debug('walker found class declaration');
        classWalker(node as ts.ClassDeclaration);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        debug('walker found function declaration');
        functionDeclarationWalker(node as ts.FunctionDeclaration);
        break;
      case ts.SyntaxKind.VariableStatement:
        debug('walker found variable statement');
        variableStatementWalker(node as ts.VariableStatement);
        break;
      case ts.SyntaxKind.ExportDeclaration:
        debug('walker found export declaration');
        exportDeclarationWalker(node as ts.ExportDeclaration);
        break;
      case ts.SyntaxKind.ExportAssignment:
        debug('walker found export assignment');
        exportAssignementWalker(node as ts.ExportAssignment);
        break;
      case ts.SyntaxKind.ExpressionStatement:
        debug('walker found expression statement');
        expressionStatementWalker(node as ts.ExpressionStatement);
        break;
      case ts.SyntaxKind.TypeAliasDeclaration:
        debug('walker found Type Alias Declaration statement');
        typeDeclarationWalker(node as ts.TypeAliasDeclaration);
        break;
      case ts.SyntaxKind.InterfaceDeclaration:
        interfaceDeclarationWalker(node as ts.InterfaceDeclaration);
        break;
      default:
        ts.forEachChild(node, walker);
    }
  }
  function hasAsyncModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration |  ts.FunctionExpression | ts.MethodDeclaration) {
    return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword): false;
  }
  function hasStaticModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration |  ts.FunctionExpression | ts.MethodDeclaration) {
    return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword): false;
  }
  function hasExportModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement) {
    return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword): false;
  }
  function hasDefaultModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration | ts.FunctionExpression | ts.VariableStatement) {
    return node.modifiers ? node.modifiers.some(mode => mode.kind === ts.SyntaxKind.DefaultKeyword): false;
  }
  function getReactInheritance(node: ts.ClassDeclaration) {
    let hasReactTypeExpression = (type: ts.ExpressionWithTypeArguments) => {
      const outerExpression = (type.expression as ts.PropertyAccessExpression)
      const outerExpressionText = outerExpression.getText();
      return ['PureComponent','Component','React.PureComponent','React.Component'].includes(outerExpressionText);
    }
    if (!node.heritageClauses) {
      return;
    }
    return node.heritageClauses.find(clause => clause.types.some(hasReactTypeExpression));
  }
  function hasReactInheritance(node: ts.ClassDeclaration) {
    return !!getReactInheritance(node);
  }
  function hasJSXChildElement(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.VariableStatement) {
    let hasJSX = false;
    ts.forEachChild(node, function visitor(child){
      if (isNodeJSX(child)) {
        hasJSX = true;
      }
      if(child.getChildren()){
        ts.forEachChild(child, visitor);
      }
    });
    return hasJSX;
  }
  function startsWithCapitalOrNoName(name: ts.__String | string) {
    if(!name) return true;
    return !!name.match(/^[A-Z]{1}/);
  }
  function parseArgumentTypeIntoComponentPropsMap(fnParamNode: ts.ParameterDeclaration) {
    let compProps: ParsedReactProp[] = [];
    if (fnParamNode) {
      const firstArgType = fnParamNode.type as ts.TypeReferenceNode;
      if (firstArgType) {
        const tsPropTypeName = firstArgType.typeName.getText();
        const maybeTypeDef = findMatchigTypeByName(tsPropTypeName as ts.__String);
        if(maybeTypeDef){
          compProps = parseReactPropsFromTypeDefinition(maybeTypeDef);
        }
      }
    }
    return compProps;
  }
  function parseVariableGenericTypeIntoComponentPropsMap(varChild: ts.VariableDeclaration) {
    let compProps: ParsedReactProp[] = [];
    if(varChild.type && varChild.type.kind == ts.SyntaxKind.TypeReference) {
      const typeNode = (varChild.type as ts.TypeReferenceNode);
      if(['FunctionComponent','React.FunctionComponent','FC','React.FC'].includes(typeNode.typeName.getText())) {
        const tsPropType = typeNode.typeArguments?.[0] as ts.TypeReferenceNode
        if(tsPropType){
          const tsPropTypeName = tsPropType.typeName.getText();
          const maybeMatchingTypeDef = findMatchigTypeByName(tsPropTypeName as ts.__String);
          if(maybeMatchingTypeDef){
            compProps = parseReactPropsFromTypeDefinition(maybeMatchingTypeDef);
          }
        }
      }
    }
    return compProps;
  }
  function classWalker(node: ts.ClassDeclaration) {
    const klass: ParsedClass = {
      name: node.name && node.name.escapedText as any,
      methods: [],
      isDefaultExport: hasDefaultModifier(node),
    };
    if(startsWithCapitalOrNoName(klass.name) && hasReactInheritance(node)){
      const currComp: ParsedReactComponent = {
        name: klass.name,
        isFunctional: false,
        isDefaultExport: hasDefaultModifier(node),
        props: [],
      }
      //parse type argument to the generic Component interface to extract propTypes
      const inheritanceClause = getReactInheritance(node);
      const inheritanceFirstType = inheritanceClause?.types[0];
      if(inheritanceFirstType && inheritanceFirstType?.typeArguments?.length) {
        const tsPropType = inheritanceFirstType.typeArguments?.[0] as ts.TypeReferenceNode
        if(tsPropType){
          currComp.tsPropTypeName = tsPropType.typeName.getText();
          const maybeMatchingTypeDef = findMatchigTypeByName(currComp.tsPropTypeName as ts.__String);
          if(maybeMatchingTypeDef){
            currComp.props = parseReactPropsFromTypeDefinition(maybeMatchingTypeDef);
          }
        }
      }
      hasExportModifier(node) ? result.exportComponents.push(currComp): result.components.push(currComp);
      return;
    }
    ts.forEachChild(node, (child) => {
      if (child.kind === ts.SyntaxKind.MethodDeclaration){
        const methodChild = child as ts.MethodDeclaration;
        const methodName = methodChild.name ? (methodChild.name as ts.Identifier).escapedText : '';
        klass.methods.push({
          methodName,
          params: methodChild.parameters.map(param => (param.name as ts.Identifier).escapedText),
          isAsync: hasAsyncModifier(methodChild),
          isStatic: hasStaticModifier(methodChild),
        })
      }
    });
    result.classes.push(klass)
    if (hasExportModifier(node)) {
      result.exportClass = klass;
    }
  }

  function importsWalker(node: ts.ImportDeclaration) {
    const names: string[] = [];
    let importText: string = ''; 
    if (node.importClause) {
      importText = node.getText();
      ts.forEachChild(node.importClause, (child) => {
        ts.forEachChild(child, (element) => {
          names.push(element.getText());
        });
      });
    }
    result.imports.push({
      path: node.moduleSpecifier.getText(),
      names,
      importText,
    });
  }

  function functionDeclarationWalker(node: ts.FunctionDeclaration){
    const parsedFunction = {
      name: node.name ? node.name.escapedText: '',
      params: node.parameters.map(param => (param.name as ts.Identifier).escapedText),
      isAsync: hasAsyncModifier(node),
      isDefaultExport: hasDefaultModifier(node)
    };
    debug('function: ', parsedFunction.name, 'isJsx', hasJSXChildElement(node))
    if(startsWithCapitalOrNoName(parsedFunction.name) && hasJSXChildElement(node)){
      const currComp: ParsedReactComponent = {
        name: parsedFunction.name,
        isFunctional: true,
        isDefaultExport: parsedFunction.isDefaultExport,
        props: [],
      }
      hasExportModifier(node) ? result.exportComponents.push(currComp): result.components.push(currComp);
      const firstArg = node.parameters[0];
      currComp.props = parseArgumentTypeIntoComponentPropsMap(firstArg);
      return;
    }
    if(hasExportModifier(node)){
      result.exportFunctions.push(parsedFunction);
    } else {
      result.functions.push(parsedFunction);
    }
  }

  function variableStatementWalker(node: ts.VariableStatement){
    // check only exported variable statements.
    if(node.declarationList){
      node.declarationList.forEachChild((child) => {
        //handle arrow function declaration
        const varChild = child as ts.VariableDeclaration;
        if(varChild.initializer && (varChild.initializer.kind === ts.SyntaxKind.ArrowFunction || varChild.initializer.kind === ts.SyntaxKind.FunctionExpression)){
          const parsedFunction = {
            name: (varChild.name as ts.Identifier).escapedText,
            params: (varChild.initializer as ts.FunctionExpression).parameters.map(param => (param.name as ts.Identifier).escapedText),
            isAsync: hasAsyncModifier(varChild.initializer as ts.FunctionExpression),
            isDefaultExport: hasDefaultModifier(varChild.initializer as ts.FunctionExpression),
          };
          if(startsWithCapitalOrNoName(parsedFunction.name) && hasJSXChildElement(node)) {
            const currComp: ParsedReactComponent = {
              name: parsedFunction.name,
              isFunctional: true,
              isDefaultExport: parsedFunction.isDefaultExport,
              props: [],
            }
            const firstArg = (varChild.initializer as ts.FunctionExpression).parameters[0];
            currComp.props = parseArgumentTypeIntoComponentPropsMap(firstArg);
            // handle component propTypes definition using FunctionComponent generic type, parse it from first typeArgument
            if(!currComp.props.length){
              currComp.props = parseVariableGenericTypeIntoComponentPropsMap(varChild);
            }
            hasExportModifier(node) ? result.exportComponents.push(currComp): result.components.push(currComp);
            return;
          }
          if (hasExportModifier(node)) {
            result.exportFunctions.push(parsedFunction);
          } else {
            result.functions.push(parsedFunction);
          }
        }
        //handle exported pojo with callable methods
        if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression){
          const parsedPojo: ParsedPojo = {
            name: varChild.name && (varChild.name as ts.Identifier).escapedText,
            isDefaultExport: hasDefaultModifier(varChild.initializer as ts.FunctionExpression),
            methods: [],
          };
          const parsedPropTypePojo: ParsedPropTypePojo = {
            name: parsedPojo.name,
            props: []
          };
          let isPropTypePojo = false;
          const currLiteralExp = (varChild.initializer as ts.ObjectLiteralExpression);
          currLiteralExp.properties.forEach((propNode: ts.Node) => {
            if (propNode.kind === ts.SyntaxKind.MethodDeclaration){
              const methodNode = propNode as ts.MethodDeclaration;
              const methodName = methodNode.name ? (methodNode.name as ts.Identifier).escapedText : '';
              parsedPojo.methods.push({
                methodName,
                params: methodNode.parameters.map(param => (param.name as ts.Identifier).escapedText),
                isAsync: hasAsyncModifier(methodNode),
                isStatic: false,
              })
            }
            if (propNode.kind === ts.SyntaxKind.PropertyAssignment &&
               (propNode as ts.PropertyAssignment).initializer.getText().trim().startsWith('PropTypes') ) {
              isPropTypePojo = true;
            }
          });
          if(isPropTypePojo){
            parsedPropTypePojo.props = parseReactPropTypesFromLiteral(currLiteralExp);
            result.propTypesPojo.push(parsedPropTypePojo);
            return;
          }
          if(hasExportModifier(node)) {
            result.exportPojos.push(parsedPojo);
          } else {
            result.pojos.push(parsedPojo);
          }
        }
        if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ClassExpression){
          const klassExp: ParsedClass = {
            name: varChild.name && (varChild.name as ts.Identifier).escapedText,
            methods: [],
            isDefaultExport: false,
          };
          ts.forEachChild(varChild.initializer, (child) => {
            const methodChild = child as ts.MethodDeclaration;
            if (child.kind === ts.SyntaxKind.MethodDeclaration){
              const methodName = methodChild.name ? (methodChild.name as ts.Identifier).escapedText : '';
              klassExp.methods.push({
                methodName,
                params: (child as ts.MethodDeclaration).parameters.map(param => (param.name as ts.Identifier).escapedText),
                isAsync: hasAsyncModifier(child as ts.MethodDeclaration),
                isStatic: hasStaticModifier(child as ts.MethodDeclaration),
              })
            }
          });
          result.classes.push(klassExp);
          result.exportClass = klassExp;
        }
      })
    }
  }

  function exportDeclarationWalker(node: ts.ExportDeclaration){
    debug('exportDeclarationWalker', node.exportClause?.getFullText());
    node.exportClause && (node.exportClause as ts.NamedExports).elements.forEach(identifier => {
      const idName = identifier.name.escapedText;
      debug('exportDeclarationWalker', idName);
      const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
      if(foundClassByIdentifier) {
        result.exportClass = foundClassByIdentifier;
      }
      const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
      if(foundFunctionByIdentifier){
        result.exportFunctions.push(foundFunctionByIdentifier);
      }
      const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
      if(foundPojoByIdentifier){
        result.exportPojos.push(foundPojoByIdentifier);
      }
      const foundComponentByIdentifier = result.components.find(component => component.name === idName);
      if(foundComponentByIdentifier){
        result.exportComponents.push(foundComponentByIdentifier);
      }
    });
  }

  function exportAssignementWalker(node: ts.ExportAssignment){
    let idName : string | ts.__String = (node.expression as ts.Identifier).escapedText;
    if( node.expression.kind === ts.SyntaxKind.CallExpression &&
        node.expression.getFullText().trim().startsWith('React.memo') ) {
      const callExpr = node.expression as ts.CallExpression;
      if(callExpr.arguments.length && callExpr.arguments[0].kind === ts.SyntaxKind.Identifier){
        idName = callExpr.arguments[0].getFullText(); 
      }
    }
    const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
    if(foundClassByIdentifier) {
      result.exportClass = {
       ...foundClassByIdentifier,
       isDefaultExport: true,
      };
    }
    const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
    if(foundFunctionByIdentifier){
      result.exportFunctions.push({
        ...foundFunctionByIdentifier,
        isDefaultExport: true,
      });
    }
    const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
      if(foundPojoByIdentifier){
        result.exportPojos.push({
          ...foundPojoByIdentifier,
          isDefaultExport: true,
        })
      }
    const foundComponentByIdentifier = result.components.find(component => component.name === idName);
    if(foundComponentByIdentifier){
      result.exportComponents.push({
        ...foundComponentByIdentifier,
        isDefaultExport: true
      });
    }
  }
  function expressionStatementWalker(node: ts.ExpressionStatement) {
    //look for binary expressions 
    if(node.expression?.kind  === ts.SyntaxKind.BinaryExpression){
      const binaryExpression = node.expression as ts.BinaryExpression;
      const leftExp = binaryExpression.left as ts.PropertyAccessExpression;
      const rightExp = binaryExpression.right as ts.ObjectLiteralExpression;
      const findMatchingComponent = (idName: ts.__String) => { 
        return result.exportComponents.find(component => component.name === idName) ||
          result.components.find(component => component.name === idName);
      }
      if (leftExp.name.escapedText === 'propTypes'){
        const expText = (leftExp.expression as ts.Identifier)?.escapedText;
        const currComponent = findMatchingComponent(expText);
        if(currComponent){
          currComponent.props = parseReactPropTypesFromLiteral(rightExp);
        }
      }
    }
  }
  function interfaceDeclarationWalker(node: ts.InterfaceDeclaration) {
    result.interfaceDefinitions.push(node);
  }
  function typeDeclarationWalker(node: ts.TypeAliasDeclaration) {
    result.typeDefinitions.push(node);
  }
  function findMatchigTypeByName(tsTypeName: ts.__String) {
    return result.typeDefinitions.find(node => node.name.escapedText === tsTypeName) || result.interfaceDefinitions.find(node => node.name.escapedText === tsTypeName);
  }
  function parseReactPropsFromTypeDefinition(node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration) {
    if (node.kind === ts.SyntaxKind.InterfaceDeclaration){
      return (node as ts.InterfaceDeclaration).members.map(prop => {
        const propDesc = prop as ts.PropertySignature;
        return {
          name: (propDesc.name as ts.Identifier).escapedText,
          type: propDesc.type?.getFullText().trim() || '',
          isOptional: !!propDesc.questionToken
        }
      })
    }
    if (node.kind === ts.SyntaxKind.TypeAliasDeclaration){
      if (node.type.kind === ts.SyntaxKind.TypeLiteral){
        return (node.type as ts.TypeLiteralNode).members.map(prop => {
          const propDesc = prop as ts.PropertySignature;
          return {
            name: (propDesc.name as ts.Identifier).escapedText,
            type: propDesc.type?.getFullText().trim() || '',
            isOptional: !!propDesc.questionToken
          }
        })
      }
      if (node.type.kind === ts.SyntaxKind.TypeReference){
        const refNode = node.type as ts.TypeReferenceNode;
        if(refNode.typeName.getFullText().trim() === 'PropTypes.InferProps'){
           const propTypePojoName = (refNode.typeArguments?.[0] as ts.TypeQueryNode).exprName.getText();
           if (propTypePojoName) {
            return result.propTypesPojo.find(pojo => pojo.name === propTypePojoName)?.props || [];
           }
        }
      }
    }
    return [];
  }
  function parseReactPropTypesFromLiteral(literalObj: ts.ObjectLiteralExpression) : ParsedReactProp[] {
    return (literalObj.properties as ts.NodeArray<ts.PropertyAssignment>).filter(prop => prop.name).map((prop: ts.PropertyAssignment) => {
      const fullPropText = prop.initializer.getFullText().trim();
      return { 
        name: (prop.name as ts.Identifier)?.escapedText,
        type: fullPropText,
        isOptional: fullPropText.indexOf('isRequired') === -1
      }
    });
  }
}

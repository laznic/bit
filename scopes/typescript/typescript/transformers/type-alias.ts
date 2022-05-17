import ts, { Node, TypeAliasDeclaration } from 'typescript';
import { TypeSchema } from '@teambit/semantics.entities.semantic-schema';
import { SchemaTransformer } from '../schema-transformer';
import { SchemaExtractorContext } from '../schema-extractor-context';
import { ExportIdentifier } from '../export-identifier';
import { typeNodeToSchema } from './utils/type-node-to-schema';

export class TypeAliasTransformer implements SchemaTransformer {
  predicate(node: Node) {
    return node.kind === ts.SyntaxKind.TypeAliasDeclaration;
  }

  async getIdentifiers(node: TypeAliasDeclaration) {
    return [new ExportIdentifier(node.name.getText(), node.getSourceFile().fileName)];
  }

  private getName(node: TypeAliasDeclaration): string {
    return node.name.getText();
  }

  async transform(typeAlias: TypeAliasDeclaration, context: SchemaExtractorContext) {
    const type = await typeNodeToSchema(typeAlias.type, context);
    const info = await context.getQuickInfo(typeAlias.name);
    const displaySig = info?.body?.displayString;
    return new TypeSchema(this.getName(typeAlias), type, displaySig as string);
  }
}

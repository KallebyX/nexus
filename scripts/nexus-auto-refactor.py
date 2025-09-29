#!/usr/bin/env python3
"""
Nexus Auto-Refactor - Sistema de Refatoração Automática
Usa análise de código para gerar sugestões e aplicar melhorias automáticas
"""

import json
import os
import re
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class RefactorSuggestion:
    """Representa uma sugestão de refatoração"""
    file_path: str
    line_number: int
    type: str  # 'complexity', 'naming', 'duplication', 'security'
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str
    current_code: str
    suggested_code: str
    rationale: str

class NexusAutoRefactor:
    def __init__(self, analysis_file="code-analysis-fixed.json"):
        self.analysis_file = analysis_file
        self.analysis_data = None
        self.suggestions = []
        self.root_path = Path("/workspaces/nexus")
        
    def load_analysis(self):
        """Carrega dados da análise de código"""
        try:
            with open(self.analysis_file, 'r') as f:
                self.analysis_data = json.load(f)
            print(f"✅ Análise carregada: {self.analysis_data['total_files']} arquivos")
        except FileNotFoundError:
            print(f"❌ Arquivo de análise não encontrado: {self.analysis_file}")
            return False
        return True
    
    def analyze_complexity_issues(self):
        """Identifica problemas de complexidade alta"""
        if not self.analysis_data:
            return
            
        print("🔍 Analisando complexidade...")
        
        # Identificar módulos com alta complexidade
        high_complexity_modules = []
        for module_name, module_data in self.analysis_data.get('modules', {}).items():
            if module_data.get('complexity', 0) > 100:  # Threshold alto
                high_complexity_modules.append((module_name, module_data['complexity']))
        
        for module_name, complexity in high_complexity_modules:
            suggestion = RefactorSuggestion(
                file_path=f"modules/{module_name}/index.js",
                line_number=1,
                type="complexity",
                severity="high",
                description=f"Módulo {module_name} tem complexidade muito alta ({complexity})",
                current_code="// Módulo com alta complexidade",
                suggested_code="// Quebrar em submódulos menores",
                rationale="Módulos com alta complexidade são difíceis de manter e testar"
            )
            self.suggestions.append(suggestion)
    
    def analyze_naming_conventions(self):
        """Analisa convenções de nomenclatura"""
        print("🔍 Analisando convenções de nomenclatura...")
        
        js_files = list(self.root_path.glob("**/*.js"))
        
        for file_path in js_files:
            if "node_modules" in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines):
                    # Verificar nomes de variáveis não descritivos
                    if re.search(r'\b(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)\b', line):
                        if 'for' in line or 'forEach' in line:
                            continue  # Aceitar variáveis de loop
                            
                        suggestion = RefactorSuggestion(
                            file_path=str(file_path.relative_to(self.root_path)),
                            line_number=i + 1,
                            type="naming",
                            severity="medium",
                            description="Nome de variável não descritivo",
                            current_code=line.strip(),
                            suggested_code="// Use nomes mais descritivos como 'index', 'item', 'result'",
                            rationale="Nomes descritivos melhoram a legibilidade do código"
                        )
                        self.suggestions.append(suggestion)
                        
            except Exception as e:
                print(f"⚠️ Erro ao analisar {file_path}: {e}")
    
    def analyze_security_issues(self):
        """Identifica possíveis problemas de segurança"""
        print("🔒 Analisando segurança...")
        
        security_patterns = [
            (r'eval\s*\(', "Uso de eval() é perigoso", "critical"),
            (r'innerHTML\s*=', "innerHTML pode ser vulnerável a XSS", "high"),
            (r'document\.write\s*\(', "document.write pode ser vulnerável", "medium"),
            (r'\.exec\s*\(', "Runtime.exec pode ser perigoso", "high"),
            (r'process\.env\.\w+', "Variáveis de ambiente expostas", "low"),
        ]
        
        js_files = list(self.root_path.glob("**/*.js"))
        
        for file_path in js_files:
            if "node_modules" in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for pattern, description, severity in security_patterns:
                    for i, line in enumerate(lines):
                        if re.search(pattern, line):
                            suggestion = RefactorSuggestion(
                                file_path=str(file_path.relative_to(self.root_path)),
                                line_number=i + 1,
                                type="security",
                                severity=severity,
                                description=description,
                                current_code=line.strip(),
                                suggested_code="// Considere alternativas mais seguras",
                                rationale="Práticas de segurança previnem vulnerabilidades"
                            )
                            self.suggestions.append(suggestion)
                            
            except Exception as e:
                print(f"⚠️ Erro ao analisar {file_path}: {e}")
    
    def analyze_code_duplication(self):
        """Identifica duplicação de código"""
        print("🔄 Analisando duplicação de código...")
        
        # Simples detecção de linhas similares
        line_hashes = {}
        js_files = list(self.root_path.glob("**/*.js"))
        
        for file_path in js_files:
            if "node_modules" in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines):
                    # Ignorar linhas vazias e comentários
                    clean_line = line.strip()
                    if not clean_line or clean_line.startswith('//') or clean_line.startswith('*'):
                        continue
                    
                    # Hash simplificado (remover espaços)
                    line_hash = re.sub(r'\s+', '', clean_line)
                    if len(line_hash) < 10:  # Ignorar linhas muito curtas
                        continue
                    
                    if line_hash in line_hashes:
                        prev_file, prev_line = line_hashes[line_hash]
                        if prev_file != str(file_path):  # Duplicação entre arquivos diferentes
                            suggestion = RefactorSuggestion(
                                file_path=str(file_path.relative_to(self.root_path)),
                                line_number=i + 1,
                                type="duplication",
                                severity="medium",
                                description=f"Código duplicado encontrado (também em {prev_file}:{prev_line})",
                                current_code=clean_line,
                                suggested_code="// Considere extrair para função utilitária",
                                rationale="Duplicação de código aumenta manutenção"
                            )
                            self.suggestions.append(suggestion)
                    else:
                        line_hashes[line_hash] = (str(file_path), i + 1)
                        
            except Exception as e:
                print(f"⚠️ Erro ao analisar {file_path}: {e}")
    
    def generate_test_suggestions(self):
        """Gera sugestões para aumentar cobertura de testes"""
        print("🧪 Analisando cobertura de testes...")
        
        # Buscar arquivos sem testes correspondentes
        src_files = []
        test_files = set()
        
        for file_path in self.root_path.glob("**/*.js"):
            if "node_modules" in str(file_path):
                continue
                
            if "test" in str(file_path) or "spec" in str(file_path):
                test_files.add(file_path.stem)
            else:
                src_files.append(file_path)
        
        for src_file in src_files:
            if src_file.stem not in test_files and "demo" not in src_file.name:
                suggestion = RefactorSuggestion(
                    file_path=str(src_file.relative_to(self.root_path)),
                    line_number=1,
                    type="testing",
                    severity="medium",
                    description=f"Arquivo sem testes: {src_file.name}",
                    current_code="// Arquivo sem cobertura de testes",
                    suggested_code=f"// Criar {src_file.stem}.test.js",
                    rationale="Testes aumentam confiabilidade e detectam regressões"
                )
                self.suggestions.append(suggestion)
    
    def generate_documentation_suggestions(self):
        """Gera sugestões para melhorar documentação"""
        print("📚 Analisando documentação...")
        
        js_files = list(self.root_path.glob("**/*.js"))
        
        for file_path in js_files:
            if "node_modules" in str(file_path):
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Verificar se tem JSDoc nos métodos principais
                functions = re.findall(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)', content)
                classes = re.findall(r'(?:export\s+)?class\s+(\w+)', content)
                
                if functions or classes:
                    # Verificar se tem documentação JSDoc
                    jsdoc_count = len(re.findall(r'/\*\*[\s\S]*?\*/', content))
                    total_items = len(functions) + len(classes)
                    
                    if jsdoc_count < total_items * 0.5:  # Menos de 50% documentado
                        suggestion = RefactorSuggestion(
                            file_path=str(file_path.relative_to(self.root_path)),
                            line_number=1,
                            type="documentation",
                            severity="low",
                            description="Documentação JSDoc insuficiente",
                            current_code=f"// {total_items} itens, {jsdoc_count} documentados",
                            suggested_code="// Adicionar comentários JSDoc para métodos e classes",
                            rationale="Documentação melhora manutenibilidade e uso da API"
                        )
                        self.suggestions.append(suggestion)
                        
            except Exception as e:
                print(f"⚠️ Erro ao analisar {file_path}: {e}")
    
    def run_analysis(self):
        """Executa todas as análises"""
        if not self.load_analysis():
            return False
            
        print("🚀 Iniciando análise de refatoração...")
        
        self.analyze_complexity_issues()
        self.analyze_naming_conventions()
        self.analyze_security_issues()
        self.analyze_code_duplication()
        self.generate_test_suggestions()
        self.generate_documentation_suggestions()
        
        return True
    
    def prioritize_suggestions(self):
        """Prioriza sugestões por impacto e severidade"""
        severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        
        self.suggestions.sort(key=lambda s: (
            severity_order.get(s.severity, 0),
            s.type == "security",  # Priorizar segurança
            s.type == "complexity"  # Depois complexidade
        ), reverse=True)
    
    def generate_report(self):
        """Gera relatório de refatoração"""
        print("\n" + "="*80)
        print("🔧 NEXUS FRAMEWORK - RELATÓRIO DE REFATORAÇÃO")
        print("="*80)
        
        if not self.suggestions:
            print("✅ Nenhuma sugestão de refatoração encontrada!")
            return
            
        # Agrupar por tipo
        by_type = {}
        for suggestion in self.suggestions:
            if suggestion.type not in by_type:
                by_type[suggestion.type] = []
            by_type[suggestion.type].append(suggestion)
        
        print(f"📊 Total de sugestões: {len(self.suggestions)}")
        
        for type_name, suggestions in by_type.items():
            print(f"\n🔹 {type_name.upper()}: {len(suggestions)} sugestões")
            
            # Mostrar as 3 mais importantes
            for i, suggestion in enumerate(suggestions[:3]):
                print(f"  [{suggestion.severity.upper()}] {suggestion.description}")
                print(f"    📁 {suggestion.file_path}:{suggestion.line_number}")
                if i < 2 and i < len(suggestions) - 1:
                    print()
        
        print(f"\n💡 Próximos passos:")
        print(f"   1. Corrigir {len([s for s in self.suggestions if s.severity == 'critical'])} problemas críticos")
        print(f"   2. Resolver {len([s for s in self.suggestions if s.severity == 'high'])} problemas de alta prioridade")
        print(f"   3. Implementar {len([s for s in self.suggestions if s.type == 'testing'])} testes pendentes")
        
        return self.suggestions
    
    def save_suggestions(self, output_file="refactor-suggestions.json"):
        """Salva sugestões em arquivo JSON"""
        suggestions_data = []
        for suggestion in self.suggestions:
            suggestions_data.append({
                "file_path": suggestion.file_path,
                "line_number": suggestion.line_number,
                "type": suggestion.type,
                "severity": suggestion.severity,
                "description": suggestion.description,
                "current_code": suggestion.current_code,
                "suggested_code": suggestion.suggested_code,
                "rationale": suggestion.rationale
            })
        
        with open(output_file, 'w') as f:
            json.dump({
                "total_suggestions": len(suggestions_data),
                "suggestions": suggestions_data,
                "summary": {
                    "critical": len([s for s in self.suggestions if s.severity == "critical"]),
                    "high": len([s for s in self.suggestions if s.severity == "high"]),
                    "medium": len([s for s in self.suggestions if s.severity == "medium"]),
                    "low": len([s for s in self.suggestions if s.severity == "low"])
                }
            }, f, indent=2)
        
        print(f"💾 Sugestões salvas em: {output_file}")

def main():
    refactor = NexusAutoRefactor()
    
    if refactor.run_analysis():
        refactor.prioritize_suggestions()
        suggestions = refactor.generate_report()
        refactor.save_suggestions()
        
        return len(suggestions)
    else:
        print("❌ Falha na análise de refatoração")
        return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
#!/usr/bin/env python3
"""
Nexus Framework Code Analyzer
Analisa o código JavaScript do framework e gera insights para melhorias
"""

import os
import json
import re
import subprocess
from pathlib import Path
from collections import defaultdict, Counter
import argparse

class NexusCodeAnalyzer:
    def __init__(self, root_path="/workspaces/nexus"):
        self.root_path = Path(root_path)
        self.js_files = []
        self.analysis_results = {
            "total_files": 0,
            "total_lines": 0,
            "modules": {},
            "dependencies": set(),
            "exports": [],
            "imports": [],
            "functions": [],
            "classes": [],
            "todos": [],
            "complexity_metrics": {},
            "coverage_estimate": {},
            "suggested_improvements": []
        }
    
    def scan_js_files(self):
        """Escaneia todos os arquivos JavaScript/TypeScript do projeto"""
        patterns = ["**/*.js", "**/*.mjs", "**/*.ts", "**/*.jsx", "**/*.tsx"]
        exclude_dirs = {"node_modules", ".git", "dist", "build", "coverage"}
        
        for pattern in patterns:
            for file_path in self.root_path.glob(pattern):
                if not any(exc in file_path.parts for exc in exclude_dirs):
                    self.js_files.append(file_path)
        
        self.analysis_results["total_files"] = len(self.js_files)
        print(f"📁 Encontrados {len(self.js_files)} arquivos JavaScript/TypeScript")
    
    def analyze_file(self, file_path):
        """Analisa um arquivo específico"""
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')
            
            file_analysis = {
                "path": str(file_path.relative_to(self.root_path)),
                "lines": len(lines),
                "imports": self.extract_imports(content),
                "exports": self.extract_exports(content),
                "functions": self.extract_functions(content),
                "classes": self.extract_classes(content),
                "todos": self.extract_todos(content, lines),
                "complexity": self.calculate_complexity(content)
            }
            
            # Determinar módulo baseado no caminho
            parts = file_path.relative_to(self.root_path).parts
            if len(parts) > 1 and parts[0] == "modules":
                module_name = parts[1] if len(parts) > 1 else "core"
            elif len(parts) > 0 and parts[0] == "cli":
                module_name = "cli"
            elif len(parts) > 0 and parts[0] == "scripts":
                module_name = "scripts"
            else:
                module_name = "core"
            
            if module_name not in self.analysis_results["modules"]:
                self.analysis_results["modules"][module_name] = {
                    "files": 0,
                    "lines": 0,
                    "functions": 0,
                    "classes": 0,
                    "complexity": 0
                }
            
            mod = self.analysis_results["modules"][module_name]
            mod["files"] += 1
            mod["lines"] += file_analysis["lines"]
            mod["functions"] += len(file_analysis["functions"])
            mod["classes"] += len(file_analysis["classes"])
            mod["complexity"] += file_analysis["complexity"]
            
            # Agregar aos resultados globais
            self.analysis_results["total_lines"] += file_analysis["lines"]
            self.analysis_results["imports"].extend(file_analysis["imports"])
            self.analysis_results["exports"].extend(file_analysis["exports"])
            self.analysis_results["functions"].extend(file_analysis["functions"])
            self.analysis_results["classes"].extend(file_analysis["classes"])
            self.analysis_results["todos"].extend(file_analysis["todos"])
            
            return file_analysis
            
        except Exception as e:
            print(f"⚠️ Erro ao analisar {file_path}: {e}")
            return None
    
    def extract_imports(self, content):
        """Extrai declarações de import"""
        imports = []
        
        # ES6 imports
        import_patterns = [
            r"import\s+(?:(?:\{[^}]+\}|\w+)\s+from\s+)?['\"]([^'\"]+)['\"]",
            r"const\s+(?:\{[^}]+\}|\w+)\s*=\s*require\(['\"]([^'\"]+)['\"]\)",
            r"import\(['\"]([^'\"]+)['\"]\)"
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            imports.extend(matches)
        
        return imports
    
    def extract_exports(self, content):
        """Extrai declarações de export"""
        exports = []
        
        export_patterns = [
            r"export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)",
            r"export\s+\{\s*([^}]+)\s*\}",
            r"module\.exports\s*=\s*(\w+)",
            r"exports\.(\w+)"
        ]
        
        for pattern in export_patterns:
            matches = re.findall(pattern, content)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        exports.extend([m.strip() for m in match if m.strip()])
                    else:
                        exports.append(match.strip())
        
        return exports
    
    def extract_functions(self, content):
        """Extrai definições de funções"""
        functions = []
        
        function_patterns = [
            r"function\s+(\w+)\s*\(",
            r"const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*",
            r"async\s+function\s+(\w+)\s*\(",
            r"(\w+)\s*:\s*(?:async\s+)?function\s*\(",
            r"(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>\s*",
            r"async\s+(\w+)\s*\("
        ]
        
        for pattern in function_patterns:
            try:
                matches = re.findall(pattern, content)
                functions.extend(matches)
            except re.error as e:
                print(f"⚠️ Erro no padrão regex: {pattern} - {e}")
        
        return functions
    
    def extract_classes(self, content):
        """Extrai definições de classes"""
        classes = []
        
        class_patterns = [
            r"class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{",
            r"export\s+class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{",
            r"function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*this\."
        ]
        
        for pattern in class_patterns:
            try:
                matches = re.findall(pattern, content)
                classes.extend(matches)
            except re.error as e:
                print(f"⚠️ Erro no padrão regex: {pattern} - {e}")
        
        return classes
    
    def extract_todos(self, content, lines):
        """Extrai comentários TODO/FIXME/HACK"""
        todos = []
        todo_pattern = r"(?://|/\*|\*|#)\s*(TODO|FIXME|HACK|BUG|XXX)(?:\s*:?\s*(.*))?$"
        
        for i, line in enumerate(lines):
            match = re.search(todo_pattern, line, re.IGNORECASE)
            if match:
                todos.append({
                    "line": i + 1,
                    "type": match.group(1).upper(),
                    "text": match.group(2) or "",
                    "full_line": line.strip()
                })
        
        return todos
    
    def calculate_complexity(self, content):
        """Calcula complexidade ciclomática aproximada"""
        complexity_keywords = [
            r"\bif\b", r"\belse\b", r"\bwhile\b", r"\bfor\b", 
            r"\bswitch\b", r"\bcase\b", r"\bcatch\b", r"\btry\b",
            r"\?\s*[^:]", r"&&", r"\|\|"
        ]
        
        complexity = 1  # Base complexity
        for pattern in complexity_keywords:
            try:
                matches = re.findall(pattern, content)
                complexity += len(matches)
            except re.error as e:
                print(f"⚠️ Erro no padrão regex: {pattern} - {e}")
        
        return complexity
    
    def analyze_dependencies(self):
        """Analisa dependências do projeto"""
        package_json = self.root_path / "package.json"
        if package_json.exists():
            try:
                data = json.loads(package_json.read_text())
                deps = set()
                for dep_type in ["dependencies", "devDependencies", "peerDependencies"]:
                    if dep_type in data:
                        deps.update(data[dep_type].keys())
                self.analysis_results["dependencies"] = deps
            except Exception as e:
                print(f"⚠️ Erro ao analisar package.json: {e}")
    
    def estimate_coverage(self):
        """Estima cobertura de funcionalidades"""
        total_modules = len(self.analysis_results["modules"])
        total_functions = len(self.analysis_results["functions"])
        total_classes = len(self.analysis_results["classes"])
        
        # Estimativa baseada em arquivos de teste
        test_files = [f for f in self.js_files if "test" in str(f) or "spec" in str(f)]
        test_coverage_estimate = min(100, (len(test_files) / max(1, total_modules)) * 100)
        
        # Estimativa baseada em documentação
        doc_files = list(self.root_path.glob("**/*.md"))
        doc_coverage_estimate = min(100, (len(doc_files) / max(1, total_modules)) * 100)
        
        self.analysis_results["coverage_estimate"] = {
            "test_coverage": round(test_coverage_estimate, 1),
            "documentation_coverage": round(doc_coverage_estimate, 1),
            "test_files": len(test_files),
            "doc_files": len(doc_files)
        }
    
    def generate_improvements(self):
        """Gera sugestões de melhorias"""
        improvements = []
        
        # Análise de TODOs
        todo_count = len(self.analysis_results["todos"])
        if todo_count > 0:
            improvements.append({
                "category": "Technical Debt",
                "priority": "Medium",
                "description": f"Resolver {todo_count} TODOs/FIXMEs pendentes",
                "impact": "Code Quality"
            })
        
        # Análise de complexidade
        high_complexity_modules = []
        for module, data in self.analysis_results["modules"].items():
            if data["files"] > 0:
                avg_complexity = data["complexity"] / data["files"]
                if avg_complexity > 50:
                    high_complexity_modules.append(module)
        
        if high_complexity_modules:
            improvements.append({
                "category": "Code Complexity",
                "priority": "High",
                "description": f"Refatorar módulos com alta complexidade: {', '.join(high_complexity_modules)}",
                "impact": "Maintainability"
            })
        
        # Análise de cobertura de testes
        test_coverage = self.analysis_results["coverage_estimate"]["test_coverage"]
        if test_coverage < 80:
            improvements.append({
                "category": "Testing",
                "priority": "High",
                "description": f"Aumentar cobertura de testes (atual: {test_coverage}%)",
                "impact": "Quality Assurance"
            })
        
        # Análise de documentação
        doc_coverage = self.analysis_results["coverage_estimate"]["documentation_coverage"]
        if doc_coverage < 90:
            improvements.append({
                "category": "Documentation",
                "priority": "Medium",
                "description": f"Melhorar documentação (atual: {doc_coverage}%)",
                "impact": "Developer Experience"
            })
        
        # Análise de dependências
        dep_count = len(self.analysis_results["dependencies"])
        if dep_count > 100:
            improvements.append({
                "category": "Dependencies",
                "priority": "Medium",
                "description": f"Revisar {dep_count} dependências para otimização",
                "impact": "Bundle Size"
            })
        
        self.analysis_results["suggested_improvements"] = improvements
    
    def run_analysis(self):
        """Executa análise completa"""
        print("🔍 Iniciando análise do Nexus Framework...")
        
        self.scan_js_files()
        
        print("📊 Analisando arquivos...")
        for file_path in self.js_files:
            self.analyze_file(file_path)
        
        print("📦 Analisando dependências...")
        self.analyze_dependencies()
        
        print("📈 Estimando cobertura...")
        self.estimate_coverage()
        
        print("💡 Gerando sugestões...")
        self.generate_improvements()
        
        print("✅ Análise concluída!")
    
    def generate_report(self, output_file="nexus-analysis.json"):
        """Gera relatório detalhado"""
        # Converter sets para listas para JSON
        report = dict(self.analysis_results)
        report["dependencies"] = list(report["dependencies"])
        
        # Estatísticas resumidas
        report["summary"] = {
            "total_files": report["total_files"],
            "total_lines": report["total_lines"],
            "total_functions": len(report["functions"]),
            "total_classes": len(report["classes"]),
            "total_modules": len(report["modules"]),
            "total_todos": len(report["todos"]),
            "avg_complexity": sum(m["complexity"] for m in report["modules"].values()) / max(1, len(report["modules"])),
            "test_coverage_estimate": report["coverage_estimate"]["test_coverage"],
            "improvement_count": len(report["suggested_improvements"])
        }
        
        # Salvar relatório
        output_path = self.root_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"📋 Relatório salvo em: {output_path}")
        return report
    
    def print_summary(self):
        """Imprime resumo da análise"""
        print("\n" + "="*60)
        print("🎯 NEXUS FRAMEWORK - ANÁLISE DE CÓDIGO")
        print("="*60)
        
        print(f"📁 Total de arquivos: {self.analysis_results['total_files']}")
        print(f"📄 Total de linhas: {self.analysis_results['total_lines']:,}")
        print(f"🔧 Total de funções: {len(self.analysis_results['functions'])}")
        print(f"🏗️ Total de classes: {len(self.analysis_results['classes'])}")
        print(f"📦 Total de módulos: {len(self.analysis_results['modules'])}")
        
        print(f"\n📊 MÓDULOS POR TAMANHO:")
        for module, data in sorted(self.analysis_results["modules"].items(), 
                                 key=lambda x: x[1]["lines"], reverse=True):
            print(f"  {module:15} | {data['files']:2} arquivos | {data['lines']:4} linhas | {data['functions']:2} funções")
        
        print(f"\n🧪 COBERTURA ESTIMADA:")
        cov = self.analysis_results["coverage_estimate"]
        print(f"  Testes: {cov['test_coverage']}%")
        print(f"  Documentação: {cov['documentation_coverage']}%")
        
        print(f"\n📝 TECHNICAL DEBT:")
        print(f"  TODOs/FIXMEs: {len(self.analysis_results['todos'])}")
        
        if self.analysis_results["suggested_improvements"]:
            print(f"\n💡 SUGESTÕES DE MELHORIA:")
            for imp in self.analysis_results["suggested_improvements"]:
                print(f"  [{imp['priority']}] {imp['description']}")
        
        print("\n" + "="*60)

def main():
    parser = argparse.ArgumentParser(description="Nexus Framework Code Analyzer")
    parser.add_argument("--path", default="/workspaces/nexus", help="Caminho do projeto")
    parser.add_argument("--output", default="nexus-analysis.json", help="Arquivo de saída")
    args = parser.parse_args()
    
    analyzer = NexusCodeAnalyzer(args.path)
    analyzer.run_analysis()
    analyzer.print_summary()
    analyzer.generate_report(args.output)

if __name__ == "__main__":
    main()
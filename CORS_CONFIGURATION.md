# 🔐 Guia de Configuração CORS para Deploy

## O que é CORS?

**CORS (Cross-Origin Resource Sharing)** é um mecanismo de segurança que controla quais domínios podem fazer requisições para sua API.

```
❌ SEM CORS configurado:
Frontend em: https://sai-frontend.onrender.com
Backend em:  https://sai-backend.onrender.com
Resultado:   ERRO 403 - Blocked by CORS

✅ COM CORS configurado:
Frontend em: https://sai-frontend.onrender.com
Backend em:  https://sai-backend.onrender.com
Resultado:   ✓ Requisição permitida
```

---

## Configuração Atual do Projeto

O arquivo `SecurityConfigurations.java` já está configurado para aceitar:

```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",                                    // Local dev
    "https://sai-api-sistema-de-agendamento-inst.vercel.app"  // Vercel antigo
));
```

---

## 📝 Atualizações Necessárias por Plataforma

### **1. RENDER**

Edite `backend/src/main/java/com/devtec/sai/config/SecurityConfigurations.java`:

```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",                    // Local development
    "https://sai-frontend.onrender.com",        // Seu frontend Render
    "https://sai-backend.onrender.com"          // Seu backend (se chamar a si mesmo)
));
```

**Processo de update:**

1. Edite `SecurityConfigurations.java` com o domínio Render
2. Commit e push no GitHub
3. Render faz auto-redeploy
4. Testar em `https://sai-frontend.onrender.com`

### **2. AWS**

Edite `backend/src/main/java/com/devtec/sai/config/SecurityConfigurations.java`:

```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",                                      // Local development
    "https://sai-frontend.surge.sh",                             // Seu domínio custom frontend
    "https://api.seu-dominio.com",                               // Seu domínio custom backend
    "https://sai-alb-1234567890.us-east-1.elb.amazonaws.com"   // ALB DNS (temporário)
));
```

**Processo de update:**

1. Edite `SecurityConfigurations.java`
2. Commit localmente
3. Build imagem Docker:
   ```bash
   docker build -t sai-backend:v2 ./backend
   docker tag sai-backend:v2 <account>.dkr.ecr.us-east-1.amazonaws.com/sai-backend:v2
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/sai-backend:v2
   ```
4. Atualizar Task Definition no ECS com nova imagem
5. Deploy Service com nova Task Definition
6. Testar endpoints

---

## 🧪 Como Testar CORS

### **Teste Local**

```bash
# Terminal 1: Inicie o backend
cd backend
./mvnw spring-boot:run

# Terminal 2: Inicie o frontend
cd front
npm run dev

# Terminal 3: Teste a requisição
curl -X GET http://localhost:8080/actuator/health \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"
```

**Resposta esperada:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json

{"status":"UP"}
```

### **Teste em Produção (RENDER)**

```bash
# Teste do frontend chamando backend
curl -X GET https://sai-backend.onrender.com/actuator/health \
  -H "Origin: https://sai-frontend.onrender.com" \
  -H "Access-Control-Request-Method: GET"
```

### **Teste em Produção (AWS)**

```bash
# Teste do frontend chamando backend
curl -X GET https://api.seu-dominio.com/actuator/health \
  -H "Origin: https://sai-frontend.surge.sh" \
  -H "Access-Control-Request-Method: GET"
```

### **Teste via Browser (DevTools)**

1. Abra `https://sai-frontend.onrender.com` no navegador
2. Pressione `F12` → **Console**
3. Execute:
   ```javascript
   fetch('https://sai-backend.onrender.com/api/v1/agendamentos', {
     method: 'GET',
     headers: {
       'Authorization': 'Bearer seu_token_aqui'
     }
   })
   .then(r => r.json())
   .then(d => console.log(d))
   .catch(e => console.error(e))
   ```

---

## ⚠️ Erros CORS Comuns

### **Erro 1: "No 'Access-Control-Allow-Origin' header"**

```
❌ CORS Policy Error
   Origin 'https://sai-frontend.onrender.com' is not allowed to access...
```

**Causa**: Domínio não está na lista de `allowedOrigins`

**Solução**:
```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://sai-frontend.onrender.com"  // ← ADICIONAR seu domínio
));
```

---

### **Erro 2: "Method not allowed by CORS"**

```
❌ CORS Policy Error
   Method 'PUT' not allowed by CORS policy
```

**Causa**: Método HTTP não está em `allowedMethods`

**Solução**:
```java
configuration.setAllowedMethods(Arrays.asList(
    "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"  // ← ADICIONAR se falta
));
```

---

### **Erro 3: "Header not allowed by CORS"**

```
❌ CORS Policy Error
   Header 'Authorization' is not allowed by CORS policy
```

**Causa**: Header não está em `allowedHeaders`

**Solução**:
```java
configuration.setAllowedHeaders(Arrays.asList(
    "Authorization", "Content-Type", "Accept", "X-Custom-Header"  // ← ADICIONAR
));
```

---

### **Erro 4: "Credentials mode is 'include' but..."**

```
❌ CORS Policy Error
   allowCredentials is false, but 'Access-Control-Allow-Credentials' header is true
```

**Causa**: Mismatch entre client e server em credenciais

**Solução**:
```java
// NO BACKEND
configuration.setAllowCredentials(true);

// NO FRONTEND (api.ts)
api.interceptors.request.use(config => {
  config.withCredentials = true;  // ← ADICIONAR
  return config;
});
```

---

## 🔐 Segurança: Boas Práticas

### **❌ NUNCA faça isso em Produção**

```java
// 🚫 INSEGURO - Permite qualquer domínio!
configuration.setAllowedOrigins(Arrays.asList("*"));
configuration.setAllowCredentials(true);  // Conflita com "*"
```

### **✅ SEMPRE faça assim**

```java
// ✓ SEGURO - Apenas domínios específicos autorizados
configuration.setAllowedOrigins(Arrays.asList(
    "https://sai-frontend.onrender.com",
    "https://seu-dominio-customizado.com"
));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
configuration.setAllowCredentials(true);
```

---

## 📋 Configuração CORS por Ambiente

### **DESENVOLVIMENTO (Local)**

```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080"
));
configuration.setMaxAge(3600);  // 1 hora
```

### **STAGING (Teste)**

```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://staging-frontend.onrender.com",
    "https://staging-api.onrender.com",
    "http://localhost:5173"  // Manter para testes locais
));
configuration.setMaxAge(3600);
```

### **PRODUÇÃO (Render)**

```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://sai-frontend.onrender.com",
    "https://seu-dominio-customizado.com"
));
configuration.setMaxAge(86400);  // 24 horas - cache maior
```

### **PRODUÇÃO (AWS)**

```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://frontend.seu-dominio.com",
    "https://api.seu-dominio.com"
));
configuration.setMaxAge(86400);
```

---

## 🚀 Implementar Configuração CORS por Perfil

Crie configuração dinâmica baseada em ambiente:

### **Option 1: Properties File**

**application.properties:**
```properties
app.cors.allowed-origins=http://localhost:5173
```

**application-prod.properties:**
```properties
app.cors.allowed-origins=https://sai-frontend.onrender.com,https://seu-dominio.com
```

**SecurityConfigurations.java:**
```java
@Configuration
public class SecurityConfigurations {
    
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Converter string em array
        String[] origins = allowedOrigins.split(",");
        configuration.setAllowedOrigins(Arrays.asList(origins));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### **Option 2: Variáveis de Ambiente**

```java
@Configuration
public class SecurityConfigurations {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Ler de variável de ambiente
        String allowedOrigins = System.getenv("ALLOWED_ORIGINS");
        if (allowedOrigins == null) {
            allowedOrigins = "http://localhost:5173";  // Default local
        }
        
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

**No Render (Environment Variables):**
```
ALLOWED_ORIGINS=https://sai-frontend.onrender.com,https://seu-dominio.com
```

**No AWS (Secrets Manager ou Environment Variables):**
```
ALLOWED_ORIGINS=https://frontend.seu-dominio.com,https://api.seu-dominio.com
```

---

## ✅ Checklist: Verificar CORS

Antes de ir para produção:

```bash
✅ Backend recebe requisições OPTIONS (preflight)
✅ Header 'Access-Control-Allow-Origin' presente
✅ Método HTTP permitido (GET, POST, PUT, DELETE)
✅ Header 'Authorization' permitido
✅ Frontend consegue fazer requisições autenticadas
✅ Cookies/credenciais funcionam se necessário
✅ Apenas domínios autorizados podem acessar
✅ Configuração diferente por ambiente (dev/staging/prod)
✅ Teste manual com curl/Postman
✅ Teste manual no navegador (DevTools)
✅ Logs mostram requisições CORS
```

---

## 📞 Debug: Habilitar Logs CORS

**application-prod.properties:**
```properties
logging.level.org.springframework.web.cors=DEBUG
logging.level.org.springframework.security.web.DefaultSecurityFilterChain=DEBUG
```

**Executar com debug:**
```bash
SPRING_PROFILES_ACTIVE=prod java -jar app.jar
```

**Esperado nos logs:**
```
DEBUG [DefaultSecurityFilterChain] Sending back CORS header...
DEBUG [CorsConfigurationSource] Matched origin: https://sai-frontend.onrender.com
```

---

## 🔗 Links Úteis

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Spring: CORS Support](https://spring.io/guides/gs/rest-service-cors/)
- [Spring Security: CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)

---

**Última atualização**: Abril de 2026  
**Versão**: 1.0  
**Status**: Production Ready



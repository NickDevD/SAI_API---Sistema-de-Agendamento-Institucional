package com.devtec.sai.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class FlywayConfig {

    /**
     * Forces entityManagerFactory to wait for Flyway migrations before Hibernate validates the schema.
     * In Spring Boot 4 the Flyway auto-configuration no longer enforces this ordering automatically.
     * Must be a static @Bean so Spring processes it as a BeanFactoryPostProcessor early enough.
     */
    @Bean
    public static BeanFactoryPostProcessor flywayDependsOnPostProcessor() {
        return (ConfigurableListableBeanFactory bf) -> {
            for (String beanName : new String[]{"entityManagerFactory", "jpaSharedEM_entityManagerFactory"}) {
                if (bf.containsBeanDefinition(beanName)) {
                    BeanDefinition def = bf.getBeanDefinition(beanName);
                    String[] existing = def.getDependsOn();
                    List<String> deps = existing != null
                            ? new ArrayList<>(Arrays.asList(existing))
                            : new ArrayList<>();
                    if (!deps.contains("flyway")) {
                        deps.add("flyway");
                        def.setDependsOn(deps.toArray(new String[0]));
                    }
                }
            }
        };
    }

    @Bean
    public Flyway flyway(DataSource dataSource) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .validateOnMigrate(true)
                .load();
        flyway.migrate();
        return flyway;
    }
}

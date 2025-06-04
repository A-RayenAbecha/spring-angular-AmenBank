package com.bankamen.specification;

import com.bankamen.dto.TransactionFilterRequest;
import com.bankamen.entity.Transaction;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.criteria.Predicate;


public class TransactionSpecification {

    public static Specification<Transaction> filterByCriteria(TransactionFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), filter.getStartDate().atStartOfDay()));
            }
            if (filter.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), filter.getEndDate().atTime(23, 59, 59)));
            }
            if (filter.getType() != null) {
                predicates.add(cb.equal(root.get("type"), filter.getType()));
            }
            if (filter.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), filter.getMinAmount()));
            }
            if (filter.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), filter.getMaxAmount()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Transaction> filterByCriteriaForUser(TransactionFilterRequest filterRequest, Long userId) {
        Specification<Transaction> spec = filterByCriteria(filterRequest);

        // Add user filtering
        Specification<Transaction> userSpec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("account").get("user").get("id"), userId);

        return spec.and(userSpec);
    }
}

